import * as sqz from "sequelize";
import {BelongsTo, BelongsToMany, Column, CreatedAt, ForeignKey, Model, NotNull, Table} from "sequelize-typescript";
import markdown from "../markdown";
import {Activity} from "./Activity";
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

    @ForeignKey(() => Activity)
    @Column({allowNull: true})
    public activityId: number;

    @BelongsTo(() => User, "authorId")
    public rAuthor: User;

    @BelongsTo(() => Activity, "activityId")
    public rActivity?: Activity;

    @BelongsToMany(() => User, () => PostVote)
    public rVotes: Array<User & {PostVote: PostVote}>;

    @CreatedAt
    public readonly createdAt!: Date;

    /**
     * Returns the author of a post
     */
    public async author(): Promise<User> {
        return await this.$get("rAuthor") as User;
    }

    /**
     * Returns the activity of the post.
     */
    public async activity(): Promise<Activity|undefined> {
        return await this.$get("rActivity") as Activity;
    }

    /**
     * Returns the votes on a post
     */
    public async votes(): Promise<Array<User & {PostVote: PostVote}>> {
        return await this.$get("rVotes") as Array<User & {PostVote: PostVote}>;
    }

    /**
     * Returns the markdown-rendered html content of the post
     */
    public get htmlContent() {
        return markdown.render(this.getDataValue("content"));
    }

    /**
     * Returns the number of upvotes on the post
     */
    public async upvotes() {
        return (await this.votes()).filter((v) => v.PostVote.voteType === VoteType.UPVOTE).length;
    }

    /**
     * Returns the number of downvotes on the post
     */
    public async downvotes() {
        return (await this.votes()).filter((v) => v.PostVote.voteType === VoteType.DOWNVOTE).length;
    }

    /**
     * Toggles the vote of the user.
     * @param userId
     * @param type
     */
    public async vote(userId: number, type: VoteType): Promise<VoteType> {
        type = type ?? VoteType.UPVOTE;
        let votes = await this.$get("rVotes", {where: {id: userId}}) as Array<User & {PostVote: PostVote}>;
        let vote = votes[0] ?? null;
        let created = false;
        if (!vote) {
            await this.$add("rVote", userId);
            votes = await this.$get("rVotes", {where: {id: userId}}) as Array<User & {PostVote: PostVote}>;
            vote = votes[0] ?? null;
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

    /**
     * Returns the type of vote that was performed on the post by the user specified by the user id.
     * @param userId
     */
    public async userVote({userId}: {userId: number}): Promise<VoteType> {
        const votes = await this.$get("rVotes", {where: {id: userId}}) as Array<User & {PostVote: PostVote}>;
        return votes[0]?.PostVote?.voteType;
    }

    /**
     * Returns if the post can be deleted by the user with the given id.
     * @param userId
     */
    public async deletable({userId}: {userId: number}): Promise<boolean> {

        const isAuthor =  Number(userId) === Number(this.authorId);
        if (!isAuthor) {
            return (await User.findOne({where: {id: userId}})).isAdmin;
        }
        return isAuthor;
    }
}
