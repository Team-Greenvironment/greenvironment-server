import {Column, ForeignKey, Model, Table} from "sequelize-typescript";
import {User} from "./User";

@Table({underscored: true})
export class Friendship extends Model<Friendship> {

    @ForeignKey(() => User)
    @Column
    public userId: number;

    @ForeignKey(() => User)
    @Column
    public friendId: number;
}
