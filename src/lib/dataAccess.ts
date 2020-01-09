import * as crypto from "crypto";
import {GraphQLError} from "graphql";
import * as sqz from "sequelize";
import {Sequelize} from "sequelize-typescript";
import {ActivityNotFoundError} from "./errors/ActivityNotFoundError";
import {ChatNotFoundError} from "./errors/ChatNotFoundError";
import {DuplicatedRequestError} from "./errors/DuplicatedRequestError";
import {EmailAlreadyRegisteredError} from "./errors/EmailAlreadyRegisteredError";
import {PostNotFoundGqlError} from "./errors/graphqlErrors";
import {GroupAlreadyExistsError} from "./errors/GroupAlreadyExistsError";
import {GroupNotFoundError} from "./errors/GroupNotFoundError";
import {InvalidLoginError} from "./errors/InvalidLoginError";
import {NoActionSpecifiedError} from "./errors/NoActionSpecifiedError";
import {UserNotFoundError} from "./errors/UserNotFoundError";
import globals from "./globals";
import {InternalEvents} from "./InternalEvents";
import {Activity} from "./models";
import * as models from "./models";

/**
 * Generates a new handle from the username and a base64 string of the current time.
 * @param username
 */
async function generateHandle(username: string) {
    username = username.toLowerCase().replace(/\s/g, "_");
    const count = await models.User.count({where: {handle: {[sqz.Op.like]: `%${username}%`}}});
    if (count > 0) {
        return `${username}${count}`;
    } else {
        return username;
    }
}

/**
 * Namespace with functions to fetch initial data for wrapping.
 */
namespace dataaccess {

    let sequelize: Sequelize;

    /**
     * Initializes everything that needs to be initialized asynchronous.
     */
    export async function init(seq: Sequelize): Promise<void> {
        sequelize = seq;
        try {
            await sequelize.addModels([
                models.ChatMember,
                models.ChatMessage,
                models.ChatRoom,
                models.Friendship,
                models.Post,
                models.PostVote,
                models.Request,
                models.User,
                models.Group,
                models.GroupAdmin,
                models.GroupMember,
                models.EventParticipant,
                models.Event,
                models.Activity,
            ]);
        } catch (err) {
            globals.logger.error(err.message);
            globals.logger.debug(err.stack);
        }
    }

    /**
     * Returns the user by handle.
     * @param userHandle
     */
    export async function getUserByHandle(userHandle: string): Promise<models.User> {
        const user = await models.User.findOne({where: {handle: userHandle}});
        if (user) {
            return user;
        } else {
            throw new UserNotFoundError(userHandle);
        }
    }

    /**
     * Returns the user by email and password
     * @param email
     * @param password
     */
    export async function getUserByLogin(email: string, password: string): Promise<models.User> {
        const hash = crypto.createHash("sha512");
        hash.update(password);
        password = hash.digest("hex");
        const user = await models.User.findOne({where: {email}});
        if (user) {
            if (user.password === password) {
                return user;
            } else {
                throw new InvalidLoginError(email);
            }
        } else {
            throw new UserNotFoundError(email);
        }
    }

    /**
     * Returns the user by auth token.
     * @param token
     */
    export async function getUserByToken(token: string): Promise<models.User> {
        return models.User.findOne({where: {authToken: token}});
    }

    /**
     * Registers a user with a username and password returning a user
     * @param username
     * @param email
     * @param password
     */
    export async function registerUser(username: string, email: string, password: string): Promise<models.User> {
        const hash = crypto.createHash("sha512");
        hash.update(password);
        password = hash.digest("hex");
        const existResult = !!(await models.User.findOne({where: {username, email, password}}));
        const handle = await generateHandle(username);
        if (!existResult) {
            return models.User.create({username, email, password, handle});
        } else {
            throw new EmailAlreadyRegisteredError(email);
        }
    }

    /**
     * Returns a post for a given postId.s
     * @param postId
     */
    export async function getPost(postId: number): Promise<models.Post> {
        const post = await models.Post.findByPk(postId);
        if (post) {
            return post;
        } else {
            return null;
        }
    }

    /**
     * Returns all posts sorted by new or top with pagination.
     * @param first
     * @param offset
     * @param sort
     */
    export async function getPosts(first: number, offset: number, sort: SortType): Promise<models.Post[]> {
        if (sort === SortType.NEW) {
            return models.Post.findAll({
                include: [{association: "rVotes"}],
                limit: first,
                offset,
                order: [["createdAt", "DESC"]],
            });
        } else {
            // more performant way to get the votes with plain sql
            return await sequelize.query(
                    `SELECT * FROM (
                 SELECT *,
                 (SELECT count(*) FROM post_votes WHERE vote_type = 'UPVOTE' AND post_id = posts.id) AS upvotes ,
                 (SELECT count(*) FROM post_votes WHERE vote_type = 'DOWNVOTE' AND post_id = posts.id) AS downvotes
                 FROM posts) AS a ORDER BY (a.upvotes - a.downvotes) DESC LIMIT ? OFFSET ?`,
                {replacements: [first, offset], mapToModel: true, model: models.Post}) as models.Post[];
        }
    }

    /**
     * Creates a post
     * @param content
     * @param authorId
     * @param activityId
     */
    export async function createPost(content: string, authorId: number, activityId?: number): Promise<models.Post> {
        const activity = await models.Activity.findByPk(activityId);
        if (!activityId || activity) {
            const post = await models.Post.create({content, authorId, activityId});
            globals.internalEmitter.emit(InternalEvents.POSTCREATE, post);
            if (activity) {
                const user = await models.User.findByPk(authorId);
                user.rankpoints += activity.points;
                await user.save();
            }
            return post;
        } else {
            throw new ActivityNotFoundError(activityId);
        }
    }

    /**
     * Deletes a post
     * @param postId
     */
    export async function deletePost(postId: number): Promise<boolean|GraphQLError> {
        try {
            const post = await models.Post.findByPk(postId, {include: [{model: Activity}, {association: "rAuthor"}]});
            const activity = await post.activity();
            const author = await post.author();
            if (activity && author) {
                author.rankpoints -= activity.points;
                await author.save();
            }
            await post.destroy();
        } catch (err) {
            globals.logger.error(err.message);
            globals.logger.debug(err.stack);
            throw new PostNotFoundGqlError(postId);
        }
        return true;
    }

    /**
     * Creates a chatroom containing two users
     * @param members
     */
    export async function createChat(...members: number[]): Promise<models.ChatRoom> {
        return sequelize.transaction(async (t) => {
            const chat = await models.ChatRoom.create({}, {transaction: t, include: [models.User]});
            for (const member of members) {
                const user = await models.User.findByPk(member);
                await chat.$add("rMember", user, {transaction: t});
            }
            await chat.save({transaction: t});
            globals.internalEmitter.emit(InternalEvents.CHATCREATE, chat);
            return chat;
        });
    }

    /**
     * Sends a message into a chat.
     * @param authorId
     * @param chatId
     * @param content
     */
    export async function sendChatMessage(authorId: number, chatId: number, content: string) {
        const chat = await models.ChatRoom.findByPk(chatId);
        if (chat) {
            const message = await chat.$create("rMessage", {content, authorId}) as models.ChatMessage;
            globals.internalEmitter.emit(InternalEvents.CHATMESSAGE, message);
            return message;
        } else {
            throw new ChatNotFoundError(chatId);
        }
    }

    /**
     * Returns all rChats.
     */
    export async function getAllChats(): Promise<models.ChatRoom[]> {
        return models.ChatRoom.findAll();
    }

    /**
     * Sends a request to a user.
     * @param sender
     * @param receiver
     * @param requestType
     */
    export async function createRequest(sender: number, receiver: number, requestType?: RequestType) {
        requestType = requestType || RequestType.FRIENDREQUEST;

        const requestExists = !!await models.Request.findOne({where:
                {senderId: sender, receiverId: receiver, requestType}});

        if (!requestExists) {
            const request = await models.Request.create({senderId: sender, receiverId: receiver, requestType});
            globals.internalEmitter.emit(InternalEvents.REQUESTCREATE, request);
            return request;
        } else {
            throw new DuplicatedRequestError();
        }
    }

    /**
     * Create a new group.
     * @param name
     * @param creator
     * @param members
     */
    export async function createGroup(name: string, creator: number, members: number[]): Promise<models.Group> {
        const groupNameExists = !!await models.Group.findOne({where: {name}});
        if (!groupNameExists) {
            members = members || [];
            return sequelize.transaction(async (t) => {
                members.push(creator);
                const groupChat = await createChat(...members);
                const group = await models.Group
                    .create({name, creatorId: creator, chatId: groupChat.id}, {transaction: t});
                const creatorUser = await models.User.findByPk(creator, {transaction: t});
                await group.$add("rAdmins", creatorUser, {transaction: t});
                for (const member of members) {
                    const user = await models.User.findByPk(member, {transaction: t});
                    await group.$add("rMembers", user, {transaction: t});
                }
                return group;
            });
        } else {
            throw new GroupAlreadyExistsError(name);
        }
    }

    /**
     * Changes the membership of a user
     * @param groupId
     * @param userId
     * @param action
     */
    export async function changeGroupMembership(groupId: number, userId: number, action: MembershipChangeAction):
        Promise<models.Group> {
        const group = await models.Group.findByPk(groupId);
        if (group) {
            const user = await models.User.findByPk(userId);
            if (user) {
                if (action === MembershipChangeAction.ADD) {
                    await group.$add("rMembers", user);
                } else if (action === MembershipChangeAction.REMOVE) {
                    await group.$remove("rMembers", user);
                } else if (action === MembershipChangeAction.OP) {
                    await group.$add("rAdmins", user);
                } else if (action === MembershipChangeAction.DEOP) {
                    await group.$remove("rAdmins", user);
                } else {
                    throw new NoActionSpecifiedError(MembershipChangeAction);
                }
                return group;
            } else {
                throw new UserNotFoundError(userId);
            }
        } else {
            throw new GroupNotFoundError(groupId);
        }
    }

    /**
     * Enum representing the types of votes that can be performed on a post.
     */
    export enum VoteType {
        UPVOTE = "UPVOTE",
        DOWNVOTE = "DOWNVOTE",
    }

    /**
     * Enum representing the types of request that can be created.
     */
    export enum RequestType {
        FRIENDREQUEST = "FRIENDREQUEST",
        GROUPINVITE = "GROUPINVITE",
        EVENTINVITE = "EVENTINVITE",
    }

    /**
     * Enum representing the types of sorting in the feed.
     */
    export enum SortType {
        TOP = "TOP",
        NEW = "NEW",
    }

    export enum MembershipChangeAction {
        ADD,
        REMOVE,
        OP,
        DEOP,
    }
}

export default dataaccess;
