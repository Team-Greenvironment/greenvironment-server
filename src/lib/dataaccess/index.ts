import {Sequelize} from "sequelize";
import {ChatNotFoundError} from "../errors/ChatNotFoundError";
import {EmailAlreadyRegisteredError} from "../errors/EmailAlreadyRegisteredError";
import {UserNotFoundError} from "../errors/UserNotFoundError";
import globals from "../globals";
import {InternalEvents} from "../InternalEvents";
import {Chatroom} from "./Chatroom";
import * as models from "./datamodels";
import {Post} from "./Post";
import {Profile} from "./Profile";
import {User} from "./User";

const config = globals.config;
const tableCreationFile = __dirname + "/../../sql/create-tables.sql";
const tableUpdateFile = __dirname + "/../../sql/update-tables.sql";

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
            await models.datainit(sequelize);
        } catch (err) {
            globals.logger.error(err.message);
            globals.logger.debug(err.stack);
        }
    }

    /**
     * Returns the user by handle.
     * @param userHandle
     */
    export async function getUserByHandle(userHandle: string): Promise<User> {
        const user = await models.SqUser.findOne({where: {handle: userHandle}});
        if (user) {
            return new User(user);
        } else {
            throw new UserNotFoundError(userHandle);
        }
    }

    /**
     * Returns the user by email and password
     * @param email
     * @param password
     */
    export async function getUserByLogin(email: string, password: string): Promise<Profile> {
        const user = await models.SqUser.findOne({where: {email, password}});
        if (user) {
            return new Profile(user);
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
    export async function registerUser(username: string, email: string, password: string) {
        const existResult = !!(await models.SqUser.findOne({where: {username, email, password}}));
        const handle = generateHandle(username);
        if (!existResult) {
            const user = await models.SqUser.create({username, email, password, handle});
            return new Profile(user);
        } else {
            throw new EmailAlreadyRegisteredError(email);
        }
    }

    /**
     * Returns a post for a given postId.s
     * @param postId
     */
    export async function getPost(postId: number): Promise<Post> {
        const post = await models.SqPost.findByPk(postId);
        if (post) {
            return new Post(post);
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
            const posts = await models.SqPost.findAll({order: [["createdAt", "DESC"]], limit: first, offset});
            return posts.map((p) => new Post(p));
        } else {
            const results: models.SqPost[] = await sequelize.query(
                    `SELECT id FROM (
                 SELECT *,
                 (SELECT count(*) FROM votes WHERE vote_type = 'UPVOTE' AND item_id = posts.id) AS upvotes ,
                 (SELECT count(*) FROM votes WHERE vote_type = 'DOWNVOTE' AND item_id = posts.id) AS downvotes
                 FROM posts) AS a ORDER BY (a.upvotes - a.downvotes) DESC LIMIT ? OFFSET ?`,
                {replacements: [first, offset], mapToModel: true, model: models.SqPost});

            return results.map((p) => new Post(p));
        }
    }

    /**
     * Creates a post
     * @param content
     * @param authorId
     * @param type
     */
    export async function createPost(content: string, authorId: number, type?: string): Promise<Post> {
        type = type || "MISC";
        const sqPost = await models.SqPost.create({content, userId: authorId});
        const post = new Post(sqPost);
        globals.internalEmitter.emit(InternalEvents.POSTCREATE, post);
        return post;
    }

    /**
     * Deletes a post
     * @param postId
     */
    export async function deletePost(postId: number): Promise<boolean> {
        await (await models.SqPost.findByPk(postId)).destroy();
        return true;
    }

    /**
     * Creates a chatroom containing two users
     * @param members
     */
    export async function createChat(...members: number[]): Promise<Chatroom> {
        return sequelize.transaction(async (t) => {
            const chat = await models.SqChat.create({}, {transaction: t});
            for (const member of members) {
                await chat.addMember(Number(member), {transaction: t});
            }
            const chatroom = new Chatroom(chat);
            globals.internalEmitter.emit(InternalEvents.CHATCREATE, chatroom);
            return chatroom;
        });
    }

    /**
     * Sends a message into a chat.
     * @param authorId
     * @param chatId
     * @param content
     */
    export async function sendChatMessage(authorId: number, chatId: number, content: string) {
        const chat = await models.SqChat.findByPk(chatId);
        if (chat) {
            const message = await chat.createMessage({content, userId: authorId});
            globals.internalEmitter.emit(InternalEvents.CHATMESSAGE, message.message);
            return message.message;
        } else {
            throw new ChatNotFoundError(chatId);
        }
    }

    /**
     * Returns all chats.
     */
    export async function getAllChats(): Promise<Chatroom[]> {
        const chats = await models.SqChat.findAll();
        return chats.map((c) => new Chatroom(c));
    }

    /**
     * Sends a request to a user.
     * @param sender
     * @param receiver
     * @param requestType
     */
    export async function createRequest(sender: number, receiver: number, requestType?: RequestType) {
        requestType = requestType || RequestType.FRIENDREQUEST;

        const request = await models.SqRequest.create({senderId: sender, receiverId: receiver, requestType});
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
