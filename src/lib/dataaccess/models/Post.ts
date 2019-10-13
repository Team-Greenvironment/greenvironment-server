import * as sqz from "sequelize";
import {BelongsTo, BelongsToMany, Column, CreatedAt, ForeignKey, Model, Table,} from "sequelize-typescript";
import markdown from "../../markdown";
import {PostVote, VoteType} from "./PostVote";
import {User} from "./User";

@Table({underscored: true})
export class Post extends Model<Post> {
    @Column(sqz.STRING(2048))
    public content: string;

    @ForeignKey(() => User)
    @Column
    public authorId: number;

    @BelongsTo(() => User, "authorId")
    public rAuthor: User;

    @BelongsToMany(() => User, () => PostVote)
    public rVotes: Array<User & {PostVote: PostVote}>;

    @CreatedAt
    public readonly createdAt!: Date;

    public async author(): Promise<User> {
        return await this.$get("rAuthor") as User;
    }

    public async votes(): Promise<Array<User & {PostVote: PostVote}>> {
        return await this.$get("rVotes") as Array<User & {PostVote: PostVote}>;
    }

    public get htmlContent() {
        return markdown.render(this.getDataValue("content"));
    }

    public async upvotes() {
        return (await this.votes()).filter((v) => v.PostVote.voteType === VoteType.UPVOTE).length;
    }

    public async downvotes() {
        return (await this.votes()).filter((v) => v.PostVote.voteType === VoteType.DOWNVOTE).length;
    }

    public async vote(userId: number, type: VoteType): Promise<VoteType> {
        type = type || VoteType.UPVOTE;
        let vote = await PostVote.findOne({where: {user_id: userId, post_id: this.id}});
        if (!vote) {
            await this.$add("rVotes", userId);
            vote = await PostVote.findOne({where: {user_id: userId, post_id: this.id}});
        }
        if (vote) {
            if (vote.voteType === type) {
                await vote.destroy();
                return null;
            } else {
                vote.voteType = type;
                await vote.save();
            }
        }

        return vote.voteType;
    }
}
