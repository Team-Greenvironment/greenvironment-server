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
        this.loadDataIfNotExists();
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
        this.loadDataIfNotExists();
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
        this.loadDataIfNotExists();
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
