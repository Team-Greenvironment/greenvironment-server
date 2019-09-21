import {Runtime} from "inspector";
import {Pool} from "pg";
import globals from "../globals";
import {QueryHelper} from "../QueryHelper";

const config = globals.config;
const tableCreationFile = __dirname + "/../sql/create-tables.sql";
const dbClient: Pool = new Pool({
    database: config.database.database,
    host: config.database.host,
    password: config.database.password,
    port: config.database.port,
    user: config.database.user,
});
const queryHelper = new QueryHelper(dbClient, tableCreationFile);

export class DTO {
    private queryHelper: QueryHelper;

    constructor() {
        this.queryHelper = queryHelper;
    }

    /**
     * Initializes everything that needs to be initialized asynchronous.
     */
    public async init() {
        await this.queryHelper.createTables();
    }

    /**
     * Returns the user by id
     * @param userId
     */
    public getUser(userId: number) {
        return new User(userId);
    }

    /**
     * Returns the user by handle.
     * @param userHandle
     */
    public async getUserByHandle(userHandle: string) {
        const result = await this.queryHelper.first({
            text: "SELECT * FROM users WHERE users.handle = $1",
            values: [userHandle],
        });
        return new User(result.id, result);
    }
}

export class User {
    public readonly id: number;
    private $name: string;
    private $handle: string;
    private $email: string;
    private $greenpoints: number;
    private $joinedAt: string;
    private dataLoaded: boolean;

    /**
     * Constructor of the user
     * @param id
     * @param row
     */
    constructor(id: number, private row?: any) {
        this.id = id;
    }

    /**
     * The name of the user
     */
    public async name(): Promise<string> {
        if (!this.dataLoaded) {
            await this.loadData();
        }
        return this.$name;
    }

    /**
     * Sets the username of the user
     * @param name
     */
    public async setName(name: string): Promise<string> {
        const result = await queryHelper.first({
            text: "UPDATE TABLE users SET name = $1 WHERE id = $2",
            values: [name, this.id],
        });
        return result.name;
    }

    /**
     * The unique handle of the user.
     */
    public async handle(): Promise<string> {
        if (!this.dataLoaded) {
            await this.loadData();
        }
        return this.$handle;
    }

    /**
     * Updates the handle of the user
     */
    public async setHandle(handle: string): Promise<string> {
        const result = await queryHelper.first({
            text: "UPDATE TABLE users SET handle = $1 WHERE id = $2",
            values: [handle, this.id],
        });
        return result.handle;
    }

    /**
     * The email of the user
     */
    public async email(): Promise<string> {
        if (!this.dataLoaded) {
            await this.loadData();
        }
        return this.$email;
    }

    /**
     * Sets the email of the user
     * @param email
     */
    public async setEmail(email: string): Promise<string> {
        const result = await queryHelper.first({
            text: "UPDATE TABLE users SET email = $1 WHERE users.id = $2 RETURNING email",
            values: [email, this.id],
        });
        return result.email;
    }

    /**
     * The number of greenpoints of the user
     */
    public async greenpoints(): Promise<number> {
        if (!this.dataLoaded) {
            await this.loadData();
        }
        return this.$greenpoints;
    }

    /**
     * Sets the greenpoints of a user.
     * @param points
     */
    public async setGreenpoints(points: number): Promise<number> {
        const result = await queryHelper.first({
            text: "UPDATE users SET greenpoints = $1 WHERE id = $2 RETURNING greenpoints",
            values: [points, this.id],
        });
        return result.greenpoints;
    }

    /**
     * The date the user joined the platform
     */
    public async joinedAt(): Promise<Date> {
        if (!this.dataLoaded) {
            await this.loadData();
        }
        return new Date(this.$joinedAt);
    }

    /**
     * Fetches the data for the user.
     */
    private async loadData(): Promise<void> {
        let result: any;
        if (this.row) {
            result = this.row;
        } else {
            result = await queryHelper.first({
                text: "SELECT * FROM users WHERE user.id = $1",
                values: [this.id],
            });
        }
        if (result) {
            this.$name = result.name;
            this.$handle = result.handle;
            this.$email = result.email;
            this.$greenpoints = result.greenpoints;
            this.$joinedAt = result.joined_at;
            this.dataLoaded = true;
        }
    }
}

export class Post {
    public readonly id: number;
    private $upvotes: number;
    private $downvotes: number;
    private $createdAt: string;
    private $content: string;
    private $author: number;
    private $type: string;
    private dataLoaded: boolean = false;

    constructor(id: number, private row?: any) {
        this.id = id;
    }

    /**
     * Returns the upvotes of a post.
     */
    public async upvotes() {
        if (!this.dataLoaded) {
            await this.loadData();
        }
        return this.$upvotes;
    }

    /**
     * Returns the downvotes of the post
     */
    public async downvotes() {
        if (!this.dataLoaded) {
            await this.loadData();
        }
        return this.$downvotes;
    }

    /**
     * Loads the data from the database if needed.
     */
    private async loadData(): Promise<void> {
        let result: any;
        if (this.row) {
            result = this.row;
        } else {
            result = await queryHelper.first({
                text: "SELECT * FROM posts WHERE posts.id = $1",
                values: [this.id],
            });
        }
        if (result) {
            this.$author = result.author;
            this.$content = result.content;
            this.$downvotes = result.downvotes;
            this.$upvotes = result.upvotes;
            this.$createdAt = result.created_at;
            this.$type = result.type;
            this.dataLoaded = true;
        }
    }
}
