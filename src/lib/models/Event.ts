import {BelongsTo, BelongsToMany, Column, ForeignKey, Model, NotNull, Table} from "sequelize-typescript";
import {EventParticipant} from "./EventParticipant";
import {Group} from "./Group";
import {User} from "./User";

/**
 * Represents an event
 */
@Table({underscored: true})
export class Event extends Model<Event> {

    /**
     * The name of the event
     */
    @NotNull
    @Column({allowNull: false})
    public name: string;

    /**
     * The date the event takes place
     */
    @NotNull
    @Column({allowNull: false})
    public dueDate: Date;

    /**
     * The group id the event belongs to
     */
    @NotNull
    @ForeignKey(() => Group)
    @Column({allowNull: false})
    public groupId: number;

    /**
     * The group the event belongs to
     */
    @BelongsTo(() => Group, "groupId")
    public rGroup: Group;

    /**
     * The participants in the event
     */
    @BelongsToMany(() => User, () => EventParticipant)
    public rParticipants: User[];

    /**
     * Returns the group the event belongs to
     */
    public async group(): Promise<Group> {
        return await this.$get("rGroup") as Group;
    }

    /**
     * Returns the participants of the event
     * @param first
     * @param offset
     */
    public async participants({first, offset}: {first: number, offset: number}): Promise<User[]> {
        const limit = first ?? 10;
        offset = offset ?? 0;
        return await this.$get("rParticipants", {limit, offset}) as User[];
    }

    /**
     * Returns if the specified user has joined the event
     * @param userId
     * @param request
     */
    public async joined({userId}: {userId: number}, request: any): Promise<boolean> {
        userId = userId ?? request.session.userId;
        const participants = await this.$get("rParticipants", {where: {id: userId}}) as User[];
        return participants.length !== 0;
    }
}
