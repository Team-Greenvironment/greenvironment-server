import {BelongsTo, BelongsToMany, Column, ForeignKey, Model, NotNull, Table} from "sequelize-typescript";
import {EventParticipant} from "./EventParticipant";
import {Group} from "./Group";
import {User} from "./User";

@Table({underscored: true})
export class Event extends Model<Event> {
    @NotNull
    @Column({allowNull: false})
    public name: string;

    @NotNull
    @Column({allowNull: false})
    public dueDate: Date;

    @NotNull
    @ForeignKey(() => Group)
    @Column({allowNull: false})
    public groupId: number;

    @BelongsTo(() => Group, "groupId")
    public rGroup: Group;

    @BelongsToMany(() => User, () => EventParticipant)
    public rParticipants: User[];

    public async group(): Promise<Group> {
        return await this.$get("rGroup") as Group;
    }

    public async participants({first, offset}: {first: number, offset: number}): Promise<User[]> {
        const limit = first ?? 10;
        offset = offset ?? 0;
        return await this.$get("rParticipants", {limit, offset}) as User[];
    }
}
