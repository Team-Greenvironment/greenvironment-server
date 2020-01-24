import {BelongsTo, Column, ForeignKey, Model, NotNull, Table} from "sequelize-typescript";
import {Post, User} from "./index";
import {ReportReason} from "./ReportReason";

/**
 * A report on a post
 */
@Table({underscored: true})
export class Report extends Model<Report> {

    /**
     * The id of the post that was reported
     */
    @ForeignKey(() => Post)
    @NotNull
    @Column({allowNull: false, onDelete: "cascade", unique: "compositeIndex"})
    public postId: number;

    /**
     * The id of the user who issued the report
     */
    @ForeignKey(() => User)
    @NotNull
    @Column({allowNull: false, onDelete: "cascade", unique: "compositeIndex"})
    public userId: number;

    /**
     * The reason for which the post was reported
     */
    @ForeignKey(() => ReportReason)
    @NotNull
    @Column({allowNull: false, onDelete: "cascade", unique: "compositeIndex"})
    public reasonId: number;

    /**
     * The user that reported the post
     */
    @BelongsTo(() => User, "userId")
    public rUser: User;

    /**
     * The post that was reported
     */
    @BelongsTo(() => Post, "postId")
    public rPost: Post;

    /**
     * The reason why the post was reported
     */
    @BelongsTo(() => ReportReason, "reasonId")
    public rReason: ReportReason;

    /**
     * Returns the user that reported the post
     */
    public async user(): Promise<User> {
        return await this.$get("rUser") as User;
    }

    /**
     * Returns the post that was reported
     */
    public async post(): Promise<Post> {
        return await this.$get("rPost") as Post;
    }

    /**
     * Returns the reason why the post was reported
     */
    public async reason(): Promise<ReportReason> {
        return await this.$get("rReason") as ReportReason;
    }
}
