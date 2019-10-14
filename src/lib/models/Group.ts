import {BelongsTo, BelongsToMany, Column, ForeignKey, Model, NotNull, Table,} from "sequelize-typescript";
import {ChatRoom} from "./ChatRoom";
import {GroupAdmin} from "./GroupAdmin";
import {GroupMember} from "./GroupMember";
import {User} from "./User";

@Table({underscored: true})
export class Group extends Model<Group> {
    @NotNull
    @Column({allowNull: false})
    public name: string;

    @NotNull
    @ForeignKey(() => User)
    @Column({allowNull: false})
    public creatorId: number;

    @NotNull
    @ForeignKey(() => ChatRoom)
    @Column({allowNull: false})
    public chatId: number;

    @BelongsTo(() => User, "creatorId")
    public rCreator: User;

    @BelongsToMany(() => User, () => GroupAdmin)
    public rAdmins: User[];

    @BelongsToMany(() => User, () => GroupMember)
    public rMembers: User[];

    @BelongsTo(() => ChatRoom)
    public rChat: ChatRoom;

    public async creator(): Promise<User> {
        return await this.$get("rCreator") as User;
    }

    public async admins(): Promise<User[]> {
        return await this.$get("rAdmins") as User[];
    }

    public async members({first, offset}: { first: number, offset: number }): Promise<User[]> {
        const limit = first || 10;
        offset = offset || 0;
        return await this.$get("rMembers", {limit, offset}) as User[];
    }

    public async chat(): Promise<ChatRoom> {
        return await this.$get("rChat") as ChatRoom;
    }
}
