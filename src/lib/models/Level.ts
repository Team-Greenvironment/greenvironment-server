import * as sqz from "sequelize";
import {Column, Model, NotNull, Table, Unique} from "sequelize-typescript";

/**
 * A level of the ranking system
 */
@Table({underscored: true})
export class Level extends Model<Level> {

    /**
     * The name of the level
     */
    @NotNull
    @Unique
    @Column({allowNull: false, type: sqz.STRING(64), unique: true})
    public name: string;

    /**
     * The number of the level
     */
    @NotNull
    @Unique
    @Column({allowNull: false, unique: true})
    public levelNumber: number;

    /**
     * The required points for the level
     */
    @NotNull
    @Unique
    @Column({allowNull: false, unique: true})
    public points: number;
}
