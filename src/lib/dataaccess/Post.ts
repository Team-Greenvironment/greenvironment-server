import {DataObject} from "./DataObject";
import {queryHelper} from "./index";
import dataaccess from "./index";
import {User} from "./User";

export class Post extends DataObject {
    public readonly id: number;
    private $upvotes: number;
    private $downvotes: number;
    private $createdAt: string;
    private $content: string;
    private $author: number;
    private $type: string;

    /**
     * Returns the upvotes of a post.
     */
    public async upvotes(): Promise<number> {
        this.loadDataIfNotExists();
        return this.$upvotes;
    }

    /**
     * Returns the downvotes of the post
     */
    public async downvotes(): Promise<number> {
        this.loadDataIfNotExists();
        return this.$downvotes;
    }

    /**
     * The content of the post (markdown)
     */
    public async content(): Promise<string> {
        this.loadDataIfNotExists();
        return this.$content;
    }

    /**
     * The date the post was created at.
     */
    public async createdAt(): Promise<string> {
        this.loadDataIfNotExists();
        return this.$createdAt;
    }

    /**
     * The autor of the post.
     */
    public async author(): Promise<User> {
        this.loadDataIfNotExists();
        return new User(this.$author);
    }

    /**
     * Deletes the post.
     */
    public async delete(): Promise<void> {
        const query = await queryHelper.first({
            text: "DELETE FROM posts WHERE id = $1",
            values: [this.id],
        });
    }

    /**
     * The type of vote the user performed on the post.
     */
    public async userVote(userId: number): Promise<dataaccess.VoteType> {
        const result = await queryHelper.first({
            text: "SELECT vote_type FROM votes WHERE user_id = $1 AND item_id = $2",
            values: [userId, this.id],
        });
        if (result) {
            return result.vote_type;
        } else {
            return null;
        }
    }

    /**
     * Loads the data from the database if needed.
     */
    protected async loadData(): Promise<void> {
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
