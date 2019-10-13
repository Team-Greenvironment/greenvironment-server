import {Column, ForeignKey, Model, NotNull, Table} from "sequelize-typescript";
import {User} from "./User";

@Table({underscored: true})
export class Friendship extends Model<Friendship> {

    @ForeignKey(() => User)
    @NotNull
    @Column({allowNull: false})
    public userId: number;

    @ForeignKey(() => User)
    @NotNull
    @Column({allowNull: false})
    public friendId: number;
}
