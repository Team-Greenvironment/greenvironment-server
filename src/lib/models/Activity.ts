import * as sqz from "sequelize";
import {Column, Model, NotNull, Table, Unique} from "sequelize-typescript";

/**
 * Represents an environmental friendly activity that provides points to level up
 */
@Table({underscored: true})
export class Activity extends Model {

    /**
     * The name of the Activity
     */
    @Unique
    @NotNull
    @Column({type: sqz.STRING(128), allowNull: false, unique: true})
    public name: string;

    /**
     * The description of the activity to describe what exactly has to be done
     */
    @NotNull
    @Column({type: sqz.TEXT, allowNull: false})
    public description: string;

    /**
     * The points one can get by completing the activity
     */
    @Column
    public points: number;
}
