import {BelongsTo, BelongsToMany, Column, ForeignKey, Model, NotNull, Table} from "sequelize-typescript";
import {Event} from "./Event";
import {User} from "./User";

@Table({underscored: true})
export class EventParticipant extends Model<EventParticipant> {
    @NotNull
    @ForeignKey(() => User)
    @Column({allowNull: false})
    public userId: number;

    @NotNull
    @ForeignKey(() => Event)
    @Column({allowNull: false})
    public eventId: number;
}
