import {Column, ForeignKey, Model, NotNull, Table,} from "sequelize-typescript";
import {Group} from "./Group";
import {User} from "./User";

@Table({underscored: true})
export class GroupMember extends Model<GroupMember> {
    @NotNull
    @ForeignKey(() => User)
    @Column({allowNull: false})
    public userId: number;

    @NotNull
    @ForeignKey(() => Group)
    @Column({allowNull: false})
    public groupId: number;
}
