import {GraphQLError} from "graphql";
import * as status from "http-status";
import dataaccess from "../lib/dataaccess";
import {Chatroom} from "../lib/dataaccess/Chatroom";
import {Post} from "../lib/dataaccess/Post";
import {Profile} from "../lib/dataaccess/Profile";
import {User} from "../lib/dataaccess/User";
import {NotLoggedInGqlError} from "../lib/errors/graphqlErrors";
import globals from "../lib/globals";
import {InternalEvents} from "../lib/InternalEvents";
import {is} from "../lib/regex";

/**
 * Returns the resolvers for the graphql api.
 * @param req - the request object
 * @param res - the response object
 */
export function resolver(req: any, res: any): any {
    return {
        getSelf() {
            if (req.session.userId) {
                return new Profile(req.session.userId);
            } else {
                res.status(status.UNAUTHORIZED);
                return new NotLoggedInGqlError();
            }
        },
        async getUser({userId, handle}: { userId: number, handle: string }) {
            if (handle) {
                return await dataaccess.getUserByHandle(handle);
            } else if (userId) {
                return new User(userId);
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
                return new Chatroom(chatId);
            } else {
                res.status(status.BAD_REQUEST);
                return new GraphQLError("No chatId given.");
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
                    return err.graphqlError || err.message;
                }
            } else {
                res.status(status.BAD_REQUEST);
                return new GraphQLError("No email or password given.");
            }
        },
        logout() {
            if (req.session.user) {
                delete req.session.user;
                return true;
            } else {
                res.status(status.UNAUTHORIZED);
                return new NotLoggedInGqlError();
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
                    return err.graphqlError || err.message;
                }
            } else {
                res.status(status.BAD_REQUEST);
                return new GraphQLError("No username, email or password given.");
            }
        },
        async vote({postId, type}: { postId: number, type: dataaccess.VoteType }) {
            if (postId && type) {
                if (req.session.userId) {
                    return await (new Post(postId)).vote(req.session.userId, type);
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
                    const post = await dataaccess.createPost(content, req.session.userId);
                    globals.internalEmitter.emit(InternalEvents.GQLPOSTCREATE, post);
                    return post;
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
                const post = new Post(postId);
                if ((await post.author()).id === req.session.userId) {
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
                    return err.graphqlError || err.message;
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
                return await dataaccess.createRequest(req.session.userId, receiver, type);
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
                const profile = new Profile(req.session.userId);
                await profile.denyRequest(sender, type);
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
                    const profile = new Profile(req.session.userId);
                    await profile.acceptRequest(sender, type);
                    return true;
                } catch (err) {
                    globals.logger.warn(err.message);
                    globals.logger.debug(err.stack);
                    res.status(status.BAD_REQUEST);
                    return err.graphqlError || err.message;
                }
            } else {
                res.status(status.BAD_REQUEST);
                return new GraphQLError("No sender or type given.");
            }
        },
    };
}
