import {Column, ForeignKey, Model, NotNull, Table} from "sequelize-typescript";
import {Event} from "./Event";
import {User} from "./User";

/**
 * A single participant in an event
 */
@Table({underscored: true})
export class EventParticipant extends Model<EventParticipant> {

    /**
     * The id of the participating user
     */
    @NotNull
    @ForeignKey(() => User)
    @Column({allowNull: false})
    public userId: number;

    /**
     * The id of the event
     */
    @NotNull
    @ForeignKey(() => Event)
    @Column({allowNull: false})
    public eventId: number;
}
