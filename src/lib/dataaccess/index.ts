import {Pool} from "pg";
import globals from "../globals";
import {QueryHelper} from "../QueryHelper";
import {User} from "./User";

const config = globals.config;
const tableCreationFile = __dirname + "/../sql/create-tables.sql";
const dbClient: Pool = new Pool({
    database: config.database.database,
    host: config.database.host,
    password: config.database.password,
    port: config.database.port,
    user: config.database.user,
});
export const queryHelper = new QueryHelper(dbClient, tableCreationFile);

namespace dataaccess {
    /**
     * Initializes everything that needs to be initialized asynchronous.
     */
    export async function init() {
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
        const result = await this.queryHelper.first({
            text: "SELECT * FROM users WHERE users.handle = $1",
            values: [userHandle],
        });
        return new User(result.id, result);
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
