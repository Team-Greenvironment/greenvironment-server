import {Sequelize} from "sequelize-typescript";
import {ChatNotFoundError} from "../errors/ChatNotFoundError";
import {EmailAlreadyRegisteredError} from "../errors/EmailAlreadyRegisteredError";
import {UserNotFoundError} from "../errors/UserNotFoundError";
import globals from "../globals";
import {InternalEvents} from "../InternalEvents";
import * as models from "./models";

/**
 * Generates a new handle from the username and a base64 string of the current time.
 * @param username
 */
function generateHandle(username: string) {
    return `${username}.${Buffer.from(Date.now().toString()).toString("base64")}`;
}

/**
 * Namespace with functions to fetch initial data for wrapping.
 */
namespace dataaccess {

    let sequelize: Sequelize;

    /**
     * Initializes everything that needs to be initialized asynchronous.
     */
    export async function init(seq: Sequelize) {
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
        const user = await models.User.findOne({where: {email, password}});
        if (user) {
            return user;
        } else {
            throw new UserNotFoundError(email);
        }
    }

    /**
     * Registers a user with a username and password returning a user
     * @param username
     * @param email
     * @param password
     */
    export async function registerUser(username: string, email: string, password: string): Promise<models.User> {
        const existResult = !!(await models.User.findOne({where: {username, email, password}}));
        const handle = generateHandle(username);
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
    export async function getPosts(first: number, offset: number, sort: SortType) {
        if (sort === SortType.NEW) {
            return models.Post.findAll({
                include: [{association: "rVotes"}],
                limit: first,
                offset,
                order: [["createdAt", "DESC"]],
            });
        } else {
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
     * @param type
     */
    export async function createPost(content: string, authorId: number, type?: string): Promise<models.Post> {
        type = type || "MISC";
        const post = await models.Post.create({content, authorId});
        globals.internalEmitter.emit(InternalEvents.POSTCREATE, post);
        return post;
    }

    /**
     * Deletes a post
     * @param postId
     */
    export async function deletePost(postId: number): Promise<boolean> {
        await (await models.Post.findByPk(postId)).destroy();
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

        const request = await models.Request.create({senderId: sender, receiverId: receiver, requestType});
        globals.internalEmitter.emit(InternalEvents.REQUESTCREATE, Request);
        return request;
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
}

export default dataaccess;
