import * as sqz from "sequelize";
import {Column, ForeignKey, Model, Table,} from "sequelize-typescript";
import {Post} from "./Post";
import {User} from "./User";

export enum VoteType {
    UPVOTE = "UPVOTE",
    DOWNVOTE = "DOWNVOTE",
}

@Table({underscored: true})
export class PostVote extends Model<PostVote> {
    @Column({type: sqz.ENUM, values: ["UPVOTE", "DOWNVOTE"]})
    public voteType: VoteType;

    @ForeignKey(() => User)
    @Column
    public userId: number;

    @ForeignKey(() => Post)
    @Column
    public postId: number;
}
