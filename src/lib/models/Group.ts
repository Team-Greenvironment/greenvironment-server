import {
    BelongsTo,
    BelongsToMany,
    Column,
    ForeignKey,
    HasMany,
    Model,
    NotNull,
    Table,
    Unique,
} from "sequelize-typescript";
import {ChatRoom} from "./ChatRoom";
import {Event} from "./Event";
import {GroupAdmin} from "./GroupAdmin";
import {GroupMember} from "./GroupMember";
import {User} from "./User";

/**
 * A single group with members
 */
@Table({underscored: true})
export class Group extends Model<Group> {

    /**
     * The name of the group
     */
    @NotNull
    @Unique
    @Column({allowNull: false, unique: true})
    public name: string;

    /**
     * The id of the user who created the group
     */
    @NotNull
    @ForeignKey(() => User)
    @Column({allowNull: false})
    public creatorId: number;

    /**
     * The id of the chat that belongs to the group
     */
    @NotNull
    @ForeignKey(() => ChatRoom)
    @Column({allowNull: false})
    public chatId: number;

    /**
     * The creator of the group
     */
    @BelongsTo(() => User, "creatorId")
    public rCreator: User;

    /**
     * The admins of the group
     */
    @BelongsToMany(() => User, () => GroupAdmin)
    public rAdmins: User[];

    /**
     * The members of the group
     */
    @BelongsToMany(() => User, () => GroupMember)
    public rMembers: User[];

    /**
     * The chatroom of the group
     */
    @BelongsTo(() => ChatRoom)
    public rChat: ChatRoom;

    /**
     * The events that were created for the group
     */
    @HasMany(() => Event, "groupId")
    public rEvents: Event[];

    /**
     * Returns the creator of the group
     */
    public async creator(): Promise<User> {
        return await this.$get("rCreator") as User;
    }

    /**
     * Returns the list of admins with pagination
     * @param first
     * @param offset
     */
    public async admins({first, offset}: { first: number, offset: number }): Promise<User[]> {
        const limit = first ?? 10;
        offset = offset ?? 0;
        return await this.$get("rAdmins", {limit, offset}) as User[];
    }

    /**
     * Returns the list of members with pagination
     * @param first
     * @param offset
     */
    public async members({first, offset}: { first: number, offset: number }): Promise<User[]> {
        const limit = first ?? 10;
        offset = offset ?? 0;
        return await this.$get("rMembers", {limit, offset}) as User[];
    }

    /**
     * Returns the chat that belongs to the group
     */
    public async chat(): Promise<ChatRoom> {
        return await this.$get("rChat") as ChatRoom;
    }

    /**
     * Returns all group events with pagination
     * @param first
     * @param offset
     */
    public async events({first, offset}: { first: number, offset: number }): Promise<Event[]> {
        const limit = first ?? 10;
        offset = offset ?? 0;
        return await this.$get("rEvents", {limit, offset}) as Event[];
    }

    /**
     * Returns if a user has joined the group
     * @param userId
     * @param request
     */
    public async joined({userId}: {userId: number}, request: any): Promise<boolean> {
        userId = userId ?? request.session.userId;
        if (userId) {
            const members = await this.$get("rMembers", {where: {id: userId}}) as User[];
            return members.length !== 0;
        } else {
            return false;
        }
    }
}
