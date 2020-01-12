import {Column, ForeignKey, Model, NotNull, Table} from "sequelize-typescript";
import {Group} from "./Group";
import {User} from "./User";

/**
 * A single member of a group
 */
@Table({underscored: true})
export class GroupMember extends Model<GroupMember> {

    /**
     * The id of the user
     */
    @NotNull
    @ForeignKey(() => User)
    @Column({allowNull: false})
    public userId: number;

    /**
     * The id of the group
     */
    @NotNull
    @ForeignKey(() => Group)
    @Column({allowNull: false})
    public groupId: number;
}
