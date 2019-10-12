import markdown from "../markdown";
import {SqPost, SqPostVotes} from "./datamodels";
import {PostVotes} from "./datamodels/models";
import dataaccess from "./index";
import {User} from "./User";

export class Post {
    public readonly id: number;
    public createdAt: Date;
    public content: string;
    public type: string;

    private post: SqPost;

    constructor(post: SqPost) {
        this.id = post.id;
        this.createdAt = post.createdAt;
        this.post = post;
        this.type = "";
        this.content = post.content;
    }

    /**
     * Returns the upvotes of a post.
     */
    public async upvotes(): Promise<number> {
        return PostVotes.count({where: {voteType: dataaccess.VoteType.UPVOTE, post_id: this.id}});
    }

    /**
     * Returns the downvotes of the post
     */
    public async downvotes(): Promise<number> {
        return PostVotes.count({where: {voteType: dataaccess.VoteType.DOWNVOTE, post_id: this.id}});
    }

    /**
     * the content rendered by markdown-it.
     */
    public async htmlContent(): Promise<string> {
        return markdown.render(this.content);
    }

    /**
     * The autor of the post.
     */
    public async author(): Promise<User> {
        return new User(await this.post.getUser());
    }

    /**
     * Deletes the post.
     */
    public async delete(): Promise<void> {
        await this.post.destroy();
    }

    /**
     * The type of vote the user performed on the post.
     */
    public async userVote(userId: number): Promise<dataaccess.VoteType> {
        const votes = await this.post.getVotes({where: {userId}});

        if (votes.length >= 1) {
            return votes[0].voteType;
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
        const [vote, _] = await SqPostVotes
            .findOrCreate({where: {userId}, defaults: {voteType: type, postId: this.post.id}});
        vote.voteType = type;
        await vote.save();
        return vote.voteType;
    }
}
