import {Pool} from "pg";
import globals from "../globals";
import {QueryHelper} from "../QueryHelper";
import {Post} from "./Post";
import {Profile} from "./Profile";
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

namespace dataaccess {

    export const pool: Pool = dbClient;

    /**
     * Initializes everything that needs to be initialized asynchronous.
     */
    export async function init() {
        await queryHelper.updateTableDefinitions();
        await queryHelper.createTables();
    }

    /**
     * Returns the user by id
     * @param userId
     */
    export function getUser(userId: number) {
        return new User(userId);
    }

    /**
     * Returns the user by handle.
     * @param userHandle
     */
    export async function getUserByHandle(userHandle: string) {
        const result = await queryHelper.first({
            text: "SELECT * FROM users WHERE users.handle = $1",
            values: [userHandle],
        });
        return new User(result.id, result);
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
            return null;
        }
    }

    /**
     * Registers a user with a username and password returning a user
     * @param username
     * @param email
     * @param password
     */
    export async function registerUser(username: string, email: string, password: string) {
        const result = await queryHelper.first({
            text: "INSERT INTO users (name, handle, password, email) VALUES ($1, $2, $3, $4) RETURNING *",
            values: [username, generateHandle(username), password, email],
        });
        return new Profile(result.id, result);
    }

    /**
     * Creates a post
     * @param content
     * @param authorId
     * @param type
     */
    export async function createPost(content: string, authorId: number, type: string) {
        const result = await queryHelper.first({
            text: "INSERT INTO posts (content, author, type) VALUES ($1, $2, $3) RETURNING *",
            values: [content, authorId, type],
        });
        return new Post(result.id, result);
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
}

export default dataaccess;
