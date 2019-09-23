import {DataObject} from "./DataObject";
import {queryHelper} from "./index";
import {Post} from "./Post";

export class User extends DataObject {
    private $name: string;
    private $handle: string;
    private $email: string;
    private $greenpoints: number;
    private $joinedAt: string;

    /**
     * The name of the user
     */
    public async name(): Promise<string> {
        this.loadDataIfNotExists();
        return this.$name;
    }

    /**
     * The unique handle of the user.
     */
    public async handle(): Promise<string> {
        this.loadDataIfNotExists();
        return this.$handle;
    }

    /**
     * The email of the user
     */
    public async email(): Promise<string> {
        this.loadDataIfNotExists();
        return this.$email;
    }

    /**
     * The number of greenpoints of the user
     */
    public async greenpoints(): Promise<number> {
        this.loadDataIfNotExists();
        return this.$greenpoints;
    }

    /**
     * The date the user joined the platform
     */
    public async joinedAt(): Promise<Date> {
        this.loadDataIfNotExists();
        return new Date(this.$joinedAt);
    }

    /**
     * Returns all posts for a user.
     */
    public async posts(): Promise<Post[]> {
        const result = await queryHelper.all({
            text: "SELECT * FROM posts WHERE author = $1",
            values: [this.id],
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
