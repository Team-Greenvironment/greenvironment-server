import markdown from "../markdown";
import {DataObject} from "./DataObject";
import {queryHelper} from "./index";
import dataaccess from "./index";
import {User} from "./User";

export class Post extends DataObject {
    public readonly id: number;
    private $createdAt: string;
    private $content: string;
    private $author: number;
    private $type: string;

    /**
     * Returns the upvotes of a post.
     */
    public async upvotes(): Promise<number> {
        const result = await queryHelper.first({
            text: "SELECT COUNT(*) count FROM votes WHERE item_id = $1 AND vote_type = 'UPVOTE'",
            values: [this.id],
        });
        return result.count;
    }

    /**
     * Returns the downvotes of the post
     */
    public async downvotes(): Promise<number> {
        const result = await queryHelper.first({
            text: "SELECT COUNT(*) count FROM votes WHERE item_id = $1 AND vote_type = 'DOWNVOTE'",
            values: [this.id],
        });
        return result.count;
    }

    /**
     * The content of the post (markdown)
     */
    public async content(): Promise<string> {
        await this.loadDataIfNotExists();
        return this.$content;
    }

    /**
     * the content rendered by markdown-it.
     */
    public async htmlContent(): Promise<string> {
        await this.loadDataIfNotExists();
        return markdown.render(this.$content);
    }

    /**
     * The date the post was created at.
     */
    public async createdAt(): Promise<string> {
        await this.loadDataIfNotExists();
        return this.$createdAt;
    }

    /**
     * The autor of the post.
     */
    public async author(): Promise<User> {
        await this.loadDataIfNotExists();
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
     * Performs a vote on a post.
     * @param userId
     * @param type
     */
    public async vote(userId: number, type: dataaccess.VoteType): Promise<dataaccess.VoteType> {
        const uVote = await this.userVote(userId);
        if (uVote === type) {
            await queryHelper.first({
                text: "DELETE FROM votes WHERE item_id = $1 AND user_id = $2",
                values: [this.id, userId],
            });
        } else {
            if (uVote) {
                await queryHelper.first({
                    text: "UPDATE votes SET vote_type = $1 WHERE user_id = $1 AND item_id = $3",
                    values: [type, userId, this.id],
                });
            } else {
                await queryHelper.first({
                    text: "INSERT INTO votes (user_id, item_id, vote_type) values ($1, $2, $3)",
                    values: [userId, this.id, type],
                });
            }
            return type;
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
            this.$createdAt = result.created_at;
            this.$type = result.type;
            this.dataLoaded = true;
        }
    }
}
