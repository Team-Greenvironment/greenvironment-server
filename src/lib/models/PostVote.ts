import * as sqz from "sequelize";
import {Column, ForeignKey, Model, NotNull, Table} from "sequelize-typescript";
import {Post} from "./Post";
import {User} from "./User";

/**
 * An enum that represents all possible types of votes
 */
export enum VoteType {
    UPVOTE = "UPVOTE",
    DOWNVOTE = "DOWNVOTE",
}

/**
 * A single vote on a post
 */
@Table({underscored: true})
export class PostVote extends Model<PostVote> {

    /**
     * The type of vote (UPVOTE/DOWNVOTE)
     */
    @NotNull
    @Column({type: sqz.ENUM, values: ["UPVOTE", "DOWNVOTE"], defaultValue: "UPVOTE", allowNull: false})
    public voteType: VoteType;

    /**
     * The id of the user that performed the vote
     */
    @ForeignKey(() => User)
    @NotNull
    @Column({allowNull: false})
    public userId: number;

    /**
     * The id of the post the vote was performed on
     */
    @ForeignKey(() => Post)
    @NotNull
    @Column({allowNull: false})
    public postId: number;
}
