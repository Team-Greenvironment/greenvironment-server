import * as sqz from "sequelize";
import {BelongsTo, BelongsToMany, Column, CreatedAt, ForeignKey, Model, NotNull, Table,} from "sequelize-typescript";
import markdown from "../markdown";
import {PostVote, VoteType} from "./PostVote";
import {User} from "./User";

@Table({underscored: true})
export class Post extends Model<Post> {
    @NotNull
    @Column({type: sqz.STRING(2048), allowNull: false})
    public content: string;

    @ForeignKey(() => User)
    @NotNull
    @Column({allowNull: false})
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
        let votes = await this.$get("rVotes", {where: {id: userId}}) as Array<User & {PostVote: PostVote}>;
        let vote = votes[0] || null;
        let created = false;
        if (!vote) {
            await this.$add("rVote", userId);
            votes = await this.$get("rVotes", {where: {id: userId}}) as Array<User & {PostVote: PostVote}>;
            vote = votes[0] || null;
            created = true;
        }
        if (vote) {
            if (vote.PostVote.voteType === type && !created) {
                await vote.PostVote.destroy();
                return null;
            } else {
                vote.PostVote.voteType = type;
                await vote.PostVote.save();
            }
        }

        return vote.PostVote.voteType;
    }
}
