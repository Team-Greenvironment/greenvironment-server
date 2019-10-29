import {Column, ForeignKey, Model, NotNull, PrimaryKey, Table} from "sequelize-typescript";
import {User} from "./User";

@Table({underscored: true})
export class Friendship extends Model<Friendship> {

    @ForeignKey(() => User)
    @PrimaryKey
    @NotNull
    @Column({allowNull: false})
    public userId: number;

    @ForeignKey(() => User)
    @PrimaryKey
    @NotNull
    @Column({allowNull: false})
    public friendId: number;
}
