import {GraphQLError} from "graphql";
import * as status from "http-status";
import * as yaml from "js-yaml";
import {Op} from "sequelize";
import dataaccess from "../lib/dataAccess";
import {NotLoggedInGqlError, PostNotFoundGqlError} from "../lib/errors/graphqlErrors";
import globals from "../lib/globals";
import {InternalEvents} from "../lib/InternalEvents";
import * as models from "../lib/models";
import {is} from "../lib/regex";

class Resolver {

}

/**
 * Returns the resolvers for the graphql api.
 * @param req - the request object
 * @param res - the response object
 */
export function resolver(req: any, res: any): any {
    return {
        async search({first, offset, query}: { first: number, offset: number, query: string }) {
            const limit = first;
            const users = await models.User.findAll({
                limit,
                offset,
                where: {
                    [Op.or]: [
                        {handle: {[Op.iRegexp]: query}},
                        {username: {[Op.iRegexp]: query}},
                    ],
                },
            });
            const groups = await models.Group.findAll({
                limit,
                offset,
                where: {name: {[Op.iRegexp]: query}},
            });
            const posts = await models.Post.findAll({
                limit,
                offset,
                where: {content: {[Op.iRegexp]: query}},
            });
            const events = await models.Event.findAll({
                limit,
                offset,
                where: {name: {[Op.iRegexp]: query}},
            });
            return {users, posts, groups, events};
        },
        async findUser({first, offset, name, handle}:
                           { first: number, offset: number, name: string, handle: string }) {
            res.status(status.MOVED_PERMANENTLY);
            if (name) {
                return models.User.findAll({where: {username: {[Op.like]: `%${name}%`}}, offset, limit: first});
            } else if (handle) {
                return models.User.findAll({where: {handle: {[Op.like]: `%${handle}%`}}, offset, limit: first});
            } else {
                res.status(status.BAD_REQUEST);
                return new GraphQLError("No search parameters provided.");
            }
        },
        async getSelf() {
            if (req.session.userId) {
                return models.User.findByPk(req.session.userId);
            } else {
                res.status(status.UNAUTHORIZED);
                return new NotLoggedInGqlError();
            }
        },
        async getUser({userId, handle}: { userId: number, handle: string }) {
            if (handle) {
                return await dataaccess.getUserByHandle(handle);
            } else if (userId) {
                return models.User.findByPk(userId);
            } else {
                res.status(status.BAD_REQUEST);
                return new GraphQLError("No userId or handle provided.");
            }
        },
        async getPost({postId}: { postId: number }) {
            if (postId) {
                return await dataaccess.getPost(postId);
            } else {
                res.status(status.BAD_REQUEST);
                return new GraphQLError("No postId given.");
            }
        },
        async getChat({chatId}: { chatId: number }) {
            if (chatId) {
                return models.ChatRoom.findByPk(chatId);
            } else {
                res.status(status.BAD_REQUEST);
                return new GraphQLError("No chatId given.");
            }
        },
        async getGroup({groupId}: { groupId: number }) {
            if (groupId) {
                return models.Group.findByPk(groupId);
            } else {
                res.status(status.BAD_REQUEST);
                return new GraphQLError("No group id given.");
            }
        },
        async getRequest({requestId}: { requestId: number }) {
            if (requestId) {
                return models.Request.findByPk(requestId);
            } else {
                res.status(status.BAD_REQUEST);
                return new GraphQLError("No requestId given.");
            }
        },
        acceptCookies() {
            req.session.cookiesAccepted = true;
            return true;
        },
        async login({email, passwordHash}: { email: string, passwordHash: string }) {
            if (email && passwordHash) {
                try {
                    const user = await dataaccess.getUserByLogin(email, passwordHash);
                    req.session.userId = user.id;
                    return user;
                } catch (err) {
                    globals.logger.warn(err.message);
                    globals.logger.debug(err.stack);
                    res.status(status.BAD_REQUEST);
                    return err.graphqlError ?? new GraphQLError(err.message);
                }
            } else {
                res.status(status.BAD_REQUEST);
                return new GraphQLError("No email or password given.");
            }
        },
        logout() {
            if (req.session.userId) {
                delete req.session.userId;
                req.session.save((err: any) => {
                    if (err) {
                        globals.logger.error(err.message);
                        globals.logger.debug(err.stack);
                    }
                });
                return true;
            } else {
                res.status(status.UNAUTHORIZED);
                return new NotLoggedInGqlError();
            }
        },
        async getToken({email, passwordHash}: { email: string, passwordHash: string }) {
            if (email && passwordHash) {
                try {
                    const user = await dataaccess.getUserByLogin(email, passwordHash);
                    return {
                        expires: Number(user.authExpire),
                        value: user.token(),
                    };
                } catch (err) {
                    res.status(status.BAD_REQUEST);
                    return err.graphqlError ?? new GraphQLError(err.message);
                }
            } else {
                res.status(status.BAD_REQUEST);
                return new GraphQLError("No email or password specified.");
            }
        },
        async register({username, email, passwordHash}: { username: string, email: string, passwordHash: string }) {
            if (username && email && passwordHash) {
                if (!is.email(email)) {
                    res.status(status.BAD_REQUEST);
                    return new GraphQLError(`'${email}' is not a valid email address!`);
                }
                try {
                    const user = await dataaccess.registerUser(username, email, passwordHash);
                    req.session.userId = user.id;
                    return user;
                } catch (err) {
                    globals.logger.warn(err.message);
                    globals.logger.debug(err.stack);
                    res.status(status.BAD_REQUEST);
                    return err.graphqlError ?? new GraphQLError(err.message);
                }
            } else {
                res.status(status.BAD_REQUEST);
                return new GraphQLError("No username, email or password given.");
            }
        },
        async setUserSettings({settings}: { settings: string }) {
            if (req.session.userId) {
                const user = await models.User.findByPk(req.session.userId);
                try {
                    user.frontendSettings = yaml.safeLoad(settings);
                    await user.save();
                    return user.settings;
                } catch (err) {
                    res.status(status.BAD_REQUEST);
                    return new GraphQLError("Invalid settings json.");
                }
            } else {
                res.status(status.UNAUTHORIZED);
                return new NotLoggedInGqlError();
            }
        },
        async vote({postId, type}: { postId: number, type: dataaccess.VoteType }) {
            if (postId && type) {
                if (req.session.userId) {
                    const post = await models.Post.findByPk(postId);
                    if (post) {
                        return await post.vote(req.session.userId, type);
                    } else {
                        res.status(status.BAD_REQUEST);
                        return new PostNotFoundGqlError(postId);
                    }
                } else {
                    res.status(status.UNAUTHORIZED);
                    return new NotLoggedInGqlError();
                }
            } else {
                res.status(status.BAD_REQUEST);
                return new GraphQLError("No postId or type given.");
            }
        },
        async createPost({content}: { content: string }) {
            if (content) {
                if (req.session.userId) {
                    if (content.length > 2048) {
                        return new GraphQLError("Content too long.");
                    } else {
                        const post = await dataaccess.createPost(content, req.session.userId);
                        globals.internalEmitter.emit(InternalEvents.GQLPOSTCREATE, post);
                        return post;
                    }
                } else {
                    res.status(status.UNAUTHORIZED);
                    return new NotLoggedInGqlError();
                }
            } else {
                res.status(status.BAD_REQUEST);
                return new GraphQLError("Can't create empty post.");
            }
        },
        async deletePost({postId}: { postId: number }) {
            if (postId) {
                const post = await models.Post.findByPk(postId, {include: [{
                        as: "rAuthor",
                        model: models.User,
                }]});
                if (post.rAuthor.id === req.session.userId) {
                    return await dataaccess.deletePost(post.id);
                } else {
                    res.status(status.FORBIDDEN);
                    return new GraphQLError("User is not author of the post.");
                }
            } else {
                return new GraphQLError("No postId given.");
            }
        },
        async createChat({members}: { members: number[] }) {
            if (req.session.userId) {
                const chatMembers = [req.session.userId];
                if (members) {
                    chatMembers.push(...members);
                }
                return await dataaccess.createChat(...chatMembers);
            } else {
                res.status(status.UNAUTHORIZED);
                return new NotLoggedInGqlError();
            }
        },
        async sendMessage({chatId, content}: { chatId: number, content: string }) {
            if (!req.session.userId) {
                res.status(status.UNAUTHORIZED);
                return new NotLoggedInGqlError();
            }
            if (chatId && content) {
                try {
                    const message = await dataaccess.sendChatMessage(req.session.userId, chatId, content);
                    globals.internalEmitter.emit(InternalEvents.GQLCHATMESSAGE, message);
                    return message;
                } catch (err) {
                    globals.logger.warn(err.message);
                    globals.logger.debug(err.stack);
                    res.status(status.BAD_REQUEST);
                    return err.graphqlError ?? new GraphQLError(err.message);
                }
            } else {
                res.status(status.BAD_REQUEST);
                return new GraphQLError("No chatId or content given.");
            }
        },
        async sendRequest({receiver, type}: { receiver: number, type: dataaccess.RequestType }) {
            if (!req.session.userId) {
                res.status(status.UNAUTHORIZED);
                return new NotLoggedInGqlError();
            }
            if (receiver && type) {
                try {
                    return await dataaccess.createRequest(req.session.userId, receiver, type);
                } catch (err) {
                    res.status(status.BAD_REQUEST);
                    return err.graphqlError ?? new GraphQLError(err.message);
                }
            } else {
                res.status(status.BAD_REQUEST);
                return new GraphQLError("No receiver or type given.");
            }
        },
        async denyRequest({sender, type}: { sender: number, type: dataaccess.RequestType }) {
            if (!req.session.userId) {
                res.status(status.UNAUTHORIZED);
                return new NotLoggedInGqlError();
            }
            if (sender && type) {
                const user = await models.User.findByPk(req.session.userId);
                await user.denyRequest(sender, type);
                return true;
            } else {
                res.status(status.BAD_REQUEST);
                return new GraphQLError("No sender or type given.");
            }
        },
        async acceptRequest({sender, type}: { sender: number, type: dataaccess.RequestType }) {
            if (!req.session.userId) {
                res.status(status.UNAUTHORIZED);
                return new NotLoggedInGqlError();
            }
            if (sender && type) {
                try {
                    const user = await models.User.findByPk(req.session.userId);
                    await user.acceptRequest(sender, type);
                    return true;
                } catch (err) {
                    globals.logger.warn(err.message);
                    globals.logger.debug(err.stack);
                    res.status(status.BAD_REQUEST);
                    return err.graphqlError ?? new GraphQLError(err.message);
                }
            } else {
                res.status(status.BAD_REQUEST);
                return new GraphQLError("No sender or type given.");
            }
        },
        async removeFriend({friendId}: { friendId: number }) {
            if (req.session.userId) {
                const self = await models.User.findByPk(req.session.userId);
                return await self.removeFriend(friendId);
            } else {
                res.status(status.UNAUTHORIZED);
                return new NotLoggedInGqlError();
            }
        },
        async getPosts({first, offset, sort}: { first: number, offset: number, sort: dataaccess.SortType }) {
            return await dataaccess.getPosts(first, offset, sort);
        },
        async createGroup({name, members}: { name: string, members: number[] }) {
            if (req.session.userId) {
                try {
                    return await dataaccess.createGroup(name, req.session.userId, members);
                } catch (err) {
                    res.status(status.BAD_REQUEST);
                    return err.graphqlError ?? new GraphQLError(err.message);
                }
            } else {
                return new NotLoggedInGqlError();
            }
        },
        async joinGroup({id}: { id: number }) {
            if (req.session.userId) {
                try {
                    return await dataaccess
                        .changeGroupMembership(id, req.session.userId, dataaccess.MembershipChangeAction.ADD);
                } catch (err) {
                    res.status(status.BAD_REQUEST);
                    return err.graphqlError ?? new GraphQLError(err.message);
                }
            } else {
                res.status(status.UNAUTHORIZED);
                return new NotLoggedInGqlError();
            }
        },
        async leaveGroup({id}: { id: number }) {
            if (req.session.userId) {
                try {
                    return await dataaccess
                        .changeGroupMembership(id, req.session.userId, dataaccess.MembershipChangeAction.REMOVE);
                } catch (err) {
                    res.status(status.BAD_REQUEST);
                    return err.graphqlError ?? new GraphQLError(err.message);
                }
            } else {
                res.status(status.UNAUTHORIZED);
                return new NotLoggedInGqlError();
            }
        },
        async addGroupAdmin({groupId, userId}: { groupId: number, userId: number }) {
            if (req.session.userId) {
                const group = await models.Group.findByPk(groupId);
                const self = await models.User.findByPk(req.session.userId);
                if (group && !(await group.$has("rAdmins", self)) && (await group.creator()) !== self.id) {
                    res.status(status.FORBIDDEN);
                    return new GraphQLError("You are not a group admin!");
                }
                try {
                    return await dataaccess
                        .changeGroupMembership(groupId, userId, dataaccess.MembershipChangeAction.OP);
                } catch (err) {
                    res.status(status.BAD_REQUEST);
                    return err.graphqlError ?? new GraphQLError(err.message);
                }

            } else {
                res.status(status.UNAUTHORIZED);
                return new NotLoggedInGqlError();
            }
        },
        async removeGroupAdmin({groupId, userId}: { groupId: number, userId: number }) {
            if (req.session.userId) {
                const group = await models.Group.findByPk(groupId);
                const isCreator = Number(group.creatorId) === Number(req.session.userId);
                const userIsCreator = Number(group.creatorId) === Number(userId);
                if (group && !isCreator && Number(userId) !== Number(req.session.userId)) {
                    res.status(status.FORBIDDEN);
                    return new GraphQLError("You are not the group creator!");
                } else if (userIsCreator) {
                    res.status(status.FORBIDDEN);
                    return new GraphQLError("You are not allowed to remove a creator as an admin.");
                }
                try {
                    return await dataaccess
                        .changeGroupMembership(groupId, userId, dataaccess.MembershipChangeAction.DEOP);
                } catch (err) {
                    res.status(status.BAD_REQUEST);
                    return err.graphqlError ?? new GraphQLError(err.message);
                }
            } else {
                res.status(status.UNAUTHORIZED);
                return new NotLoggedInGqlError();
            }
        },
        async createEvent({name, dueDate, groupId}: { name: string, dueDate: string, groupId: number }) {
            if (req.session.userId) {
                const date = new Date(Number(dueDate));
                const group = await models.Group.findByPk(groupId);
                return group.$create<models.Event>("rEvent", {name, dueDate: date});
            } else {
                res.status(status.UNAUTHORIZED);
                return new NotLoggedInGqlError();
            }
        },
        async joinEvent({eventId}: { eventId: number }) {
            if (req.session.userId) {
                const event = await models.Event.findByPk(eventId);
                const self = await models.User.findByPk(req.session.userId);
                await event.$add("rParticipants", self);
                return event;
            } else {
                res.status(status.UNAUTHORIZED);
                return new NotLoggedInGqlError();
            }
        },
        async leaveEvent({eventId}: { eventId: number }) {
            if (req.session.userId) {
                const event = await models.Event.findByPk(eventId);
                const self = await models.User.findByPk(req.session.userId);
                await event.$remove("rParticipants", self);
                return event;
            } else {
                res.status(status.UNAUTHORIZED);
                return new NotLoggedInGqlError();
            }
        },
    };
}
