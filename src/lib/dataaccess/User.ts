import {DataObject} from "./DataObject";
import {queryHelper} from "./index";
import {Post} from "./Post";

export class User extends DataObject {
    private $name: string;
    private $handle: string;
    private $email: string;
    private $greenpoints: number;
    private $joinedAt: string;
    private $exists: boolean;

    /**
     * The name of the user
     */
    public async name(): Promise<string> {
        await this.loadDataIfNotExists();
        return this.$name;
    }

    /**
     * The unique handle of the user.
     */
    public async handle(): Promise<string> {
        await this.loadDataIfNotExists();
        return this.$handle;
    }

    /**
     * The email of the user
     */
    public async email(): Promise<string> {
        await this.loadDataIfNotExists();
        return this.$email;
    }

    /**
     * The number of greenpoints of the user
     */
    public async greenpoints(): Promise<number> {
        await this.loadDataIfNotExists();
        return this.$greenpoints;
    }

    /**
     * Returns the number of posts the user created
     */
    public async numberOfPosts(): Promise<number> {
        const result = await queryHelper.first({
            text: "SELECT COUNT(*) count FROM posts WHERE author = $1",
            values: [this.id],
        });
        return result.count;
    }

    /**
     * The date the user joined the platform
     */
    public async joinedAt(): Promise<Date> {
        await this.loadDataIfNotExists();
        return new Date(this.$joinedAt);
    }

    /**
     * Returns all posts for a user.
     */
    public async posts({first, offset}: {first: number, offset: number}): Promise<Post[]> {
        first = first || 10;
        offset = offset || 0;
        const result = await queryHelper.all({
            text: "SELECT * FROM posts WHERE author = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
            values: [this.id, first, offset],
        });
        const posts = [];

        for (const row of result) {
            posts.push(new Post(row.id, row));
        }
        return posts;
    }

    /**
     * Fetches the data for the user.
     */
    protected async loadData(): Promise<void> {
        let result: any;
        if (this.row) {
            result = this.row;
        } else {
            result = await queryHelper.first({
                text: "SELECT * FROM users WHERE users.id = $1",
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
