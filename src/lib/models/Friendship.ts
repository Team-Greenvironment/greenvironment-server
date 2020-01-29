import {Column, ForeignKey, Model, NotNull, PrimaryKey, Table} from "sequelize-typescript";
import {User} from "./User";

/**
 * A friendship between two users
 */
@Table({underscored: true})
export class Friendship extends Model<Friendship> {

    /**
     * The id of the first user
     */
    @ForeignKey(() => User)
    @NotNull
    @Column({allowNull: false})
    public userId: number;

    /**
     * The id of the second user
     */
    @ForeignKey(() => User)
    @NotNull
    @Column({allowNull: false})
    public friendId: number;
}
