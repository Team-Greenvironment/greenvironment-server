import * as sqz from "sequelize";
import {
    BelongsTo,
    BelongsToMany,
    Column,
    CreatedAt,
    ForeignKey,
    HasMany,
    Model,
    NotNull,
    Table,
} from "sequelize-typescript";
import markdown from "../markdown";
import {Activity} from "./Activity";
import {Media} from "./Media";
import {PostVote, VoteType} from "./PostVote";
import {Report} from "./Report";
import {User} from "./User";

/**
 * A single post of a user
 */
@Table({underscored: true})
export class Post extends Model<Post> {

    /**
     * The markdown formatted utf-8 content of the post
     */
    @NotNull
    @Column({type: sqz.STRING(2048), allowNull: false})
    public content: string;

    /**
     * If the post is publically visible
     */
    @NotNull
    @Column({defaultValue: true, allowNull: false})
    public visible: boolean;

    /**
     * The id of the post author
     */
    @ForeignKey(() => User)
    @NotNull
    @Column({allowNull: false})
    public authorId: number;

    /**
     * The id of the activiy of the post if one was provided during creation
     */
    @ForeignKey(() => Activity)
    @Column({allowNull: true})
    public activityId: number;

    /**
     * An id pointing to a media entry
     */
    @ForeignKey(() => Media)
    @Column({allowNull: true})
    public mediaId: number;

    /**
     * The author of the post
     */
    @BelongsTo(() => User, "authorId")
    public rAuthor: User;

    /**
     * The activiy of the post
     */
    @BelongsTo(() => Activity, "activityId")
    public rActivity?: Activity;

    /**
     * The media of the post
     */
    @BelongsTo(() => Media, "mediaId")
    public rMedia?: Media;

    /**
     * The votes that were performed on the post
     */
    @BelongsToMany(() => User, () => PostVote)
    // tslint:disable-next-line:completed-docs
    public rVotes: Array<User & { PostVote: PostVote }>;

    /**
     * The reports on the post
     */
    @HasMany(() => Report, "postId")
    public rReports: Report[];

    /**
     * The date the post was created at
     */
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
    public async activity(): Promise<Activity | undefined> {
        return await this.$get("rActivity") as Activity;
    }

    /**
     * Returns the votes on a post
     */
    public async votes(): Promise<Array<User & { PostVote: PostVote }>> {
        return await this.$get("rVotes") as Array<User & { PostVote: PostVote }>;
    }

    /**
     * Returns the reports on the post
     */
    public async reports({first, offset}: {first: number, offset: number}): Promise<Report[]> {
        return await this.$get("rReports", {limit: first, offset}) as Report[];
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
     * Returns the media description object of the post
     */
    public async media() {
        return await this.$get<Media>("rMedia") as Media;
    }

    /**
     * Toggles the vote of the user.
     * @param userId
     * @param type
     */
    public async vote(userId: number, type: VoteType): Promise<VoteType> {
        type = type ?? VoteType.UPVOTE;
        let votes = await this.$get("rVotes", {where: {id: userId}}) as Array<User & { PostVote: PostVote }>;
        let vote = votes[0] ?? null;
        let created = false;
        if (!vote) {
            await this.$add("rVote", userId);
            votes = await this.$get("rVotes", {where: {id: userId}}) as Array<User & { PostVote: PostVote }>;
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
     * @param request
     */
    public async userVote({userId}: { userId: number }, request: any): Promise<VoteType> {
        userId = userId ?? request.session.userId;
        if (userId) {
            const votes = await this.$get("rVotes", {where: {id: userId}}) as Array<User & { PostVote: PostVote }>;
            return votes[0]?.PostVote?.voteType;
        } else {
            return undefined;
        }
    }

    /**
     * Returns if the post can be deleted by the user with the given id.
     * @param userId
     * @param request
     */
    public async deletable({userId}: { userId: number }, request: any): Promise<boolean> {
        userId = userId ?? request.session.userId;
        const isAuthor = Number(userId) === Number(this.authorId);
        if (userId && !isAuthor) {
            return (await User.findOne({where: {id: userId}})).isAdmin;
        }
        return isAuthor;
    }
}
