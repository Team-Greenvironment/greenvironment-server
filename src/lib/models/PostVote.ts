import * as sqz from "sequelize";
import {Column, ForeignKey, Model, NotNull, Table,} from "sequelize-typescript";
import {Post} from "./Post";
import {User} from "./User";

export enum VoteType {
    UPVOTE = "UPVOTE",
    DOWNVOTE = "DOWNVOTE",
}

@Table({underscored: true})
export class PostVote extends Model<PostVote> {
    @NotNull
    @Column({type: sqz.ENUM, values: ["UPVOTE", "DOWNVOTE"], defaultValue: "UPVOTE", allowNull: false})
    public voteType: VoteType;

    @ForeignKey(() => User)
    @NotNull
    @Column({allowNull: false})
    public userId: number;

    @ForeignKey(() => Post)
    @NotNull
    @Column({allowNull: false})
    public postId: number;
}
