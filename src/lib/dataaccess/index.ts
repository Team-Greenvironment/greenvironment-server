import {Pool} from "pg";
import {ChatNotFoundError} from "../errors/ChatNotFoundError";
import {EmailAlreadyRegisteredError} from "../errors/EmailAlreadyRegisteredError";
import {UserNotFoundError} from "../errors/UserNotFoundError";
import globals from "../globals";
import {InternalEvents} from "../InternalEvents";
import {QueryHelper} from "../QueryHelper";
import {ChatMessage} from "./ChatMessage";
import {Chatroom} from "./Chatroom";
import {Post} from "./Post";
import {Profile} from "./Profile";
import {Request} from "./Request";
import {User} from "./User";

const config = globals.config;
const tableCreationFile = __dirname + "/../../sql/create-tables.sql";
const tableUpdateFile = __dirname + "/../../sql/update-tables.sql";

const dbClient: Pool = new Pool({
    database: config.database.database,
    host: config.database.host,
    password: config.database.password,
    port: config.database.port,
    user: config.database.user,
});
export const queryHelper = new QueryHelper(dbClient, tableCreationFile, tableUpdateFile);

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

    export const pool: Pool = dbClient;

    /**
     * Initializes everything that needs to be initialized asynchronous.
     */
    export async function init() {
        try {
            await queryHelper.init();
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
        const result = await queryHelper.first({
            text: "SELECT * FROM users WHERE users.handle = $1",
            values: [userHandle],
        });
        if (result) {
            return new User(result.id, result);
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
        const result = await queryHelper.first({
            text: "SELECT * FROM users WHERE email = $1 AND password = $2",
            values: [email, password],
        });
        if (result) {
            return new Profile(result.id, result);
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
        const existResult = await queryHelper.first({
            text: "SELECT email FROM users WHERE email = $1;",
            values: [email],
        });
        if (!existResult || !existResult.email) {
            const result = await queryHelper.first({
                text: "INSERT INTO users (name, handle, password, email) VALUES ($1, $2, $3, $4) RETURNING *",
                values: [username, generateHandle(username), password, email],
            });
            return new Profile(result.id, result);
        } else {
            throw new EmailAlreadyRegisteredError(email);
        }
    }

    /**
     * Returns a post for a given postId.s
     * @param postId
     */
    export async function getPost(postId: number): Promise<Post> {
        const result = await queryHelper.first({
            text: "SELECT * FROM posts WHERE id = $1",
            values: [postId],
        });
        if (result) {
            return new Post(result.id, result);
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
            const results = await queryHelper.all({
                cache: true,
                text: "SELECT * FROM posts ORDER BY created_at DESC LIMIT $1 OFFSET $2",
                values: [first, offset],
            });
            const posts = [];
            for (const row of results) {
                posts.push(new Post(row.id, row));
            }
            return posts;
        } else {
            const results = await queryHelper.all({
                cache: true,
                text: `
                    SELECT * FROM (
                    SELECT *,
                    (SELECT count(*) FROM votes WHERE vote_type = 'UPVOTE' AND item_id = posts.id) AS upvotes ,
                    (SELECT count(*) FROM votes WHERE vote_type = 'DOWNVOTE' AND item_id = posts.id) AS downvotes
                    FROM posts) AS a ORDER BY (a.upvotes - a.downvotes) DESC LIMIT $1 OFFSET $2;
                `,
                values: [first, offset],
            });
            const posts = [];
            for (const row of results) {
                posts.push(new Post(row.id, row));
            }
            return posts;
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
        const result = await queryHelper.first({
            text: "INSERT INTO posts (content, author, type) VALUES ($1, $2, $3) RETURNING *",
            values: [content, authorId, type],
        });
        const post = new Post(result.id, result);
        globals.internalEmitter.emit(InternalEvents.POSTCREATE, post);
        return post;
    }

    /**
     * Deletes a post
     * @param postId
     */
    export async function deletePost(postId: number): Promise<boolean> {
        const result = await queryHelper.first({
            text: "DELETE FROM posts WHERE posts.id = $1",
            values: [postId],
        });
        return true;
    }

    /**
     * Creates a chatroom containing two users
     * @param members
     */
    export async function createChat(...members: number[]): Promise<Chatroom> {
        const idResult = await queryHelper.first({
            text: "INSERT INTO chats (id) values (default) RETURNING *;",
        });
        const id = idResult.id;
        const transaction = await queryHelper.createTransaction();
        try {
            await transaction.begin();
            for (const member of members) {
                await transaction.query({
                    name: "chat-member-insert",
                    text: "INSERT INTO chat_members (chat, member) VALUES ($1, $2);",
                    values: [id, member],
                });
            }
            await transaction.commit();
        } catch (err) {
            globals.logger.warn(`Failed to insert chatmember into database: ${err.message}`);
            globals.logger.debug(err.stack);
            await transaction.rollback();
        } finally {
            transaction.release();
        }
        const chat = new Chatroom(id);
        globals.internalEmitter.emit(InternalEvents.CHATCREATE, chat);
        return chat;
    }

    /**
     * Sends a message into a chat.
     * @param authorId
     * @param chatId
     * @param content
     */
    export async function sendChatMessage(authorId: number, chatId: number, content: string) {
        const chat = new Chatroom(chatId);
        if ((await chat.exists())) {
            const result = await queryHelper.first({
                text: "INSERT INTO chat_messages (chat, author, content) values ($1, $2, $3) RETURNING *",
                values: [chatId, authorId, content],
            });
            const message = new ChatMessage(new User(result.author), chat, result.created_at, result.content);
            globals.internalEmitter.emit(InternalEvents.CHATMESSAGE, message);
            return message;
        } else {
            throw new ChatNotFoundError(chatId);
        }
    }

    /**
     * Returns all chats.
     */
    export async function getAllChats(): Promise<Chatroom[]> {
        const result = await queryHelper.all({
            text: "SELECT id FROM chats;",
        });
        const chats = [];
        for (const row of result) {
            chats.push(new Chatroom(row.id));
        }
        return chats;
    }

    /**
     * Sends a request to a user.
     * @param sender
     * @param receiver
     * @param type
     */
    export async function createRequest(sender: number, receiver: number, type?: RequestType) {
        type = type || RequestType.FRIENDREQUEST;

        const result = await queryHelper.first({
            text: "INSERT INTO requests (sender, receiver, type) VALUES ($1, $2, $3) RETURNING *",
            values: [sender, receiver, type],
        });
        const request = new Request(new User(result.sender), new User(result.receiver), result.type);
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
