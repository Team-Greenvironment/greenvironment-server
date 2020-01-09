import * as sqz from "sequelize";
import {Column, ForeignKey, Model, NotNull, Table, Unique} from "sequelize-typescript";

@Table({underscored: true})
export class Activity extends Model {

    @Unique
    @NotNull
    @Column({type: sqz.STRING(128), allowNull: false, unique: true})
    public name: string;

    @NotNull
    @Column({type: sqz.TEXT, allowNull: false})
    public description: string;

    @Column
    public points: number;
}
