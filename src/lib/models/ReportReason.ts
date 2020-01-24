import * as sqz from "sequelize";
import {Column, Model, NotNull, Table, Unique} from "sequelize-typescript";

/**
 * A reason for why a post was reported
 */
@Table({underscored: true})
export class ReportReason extends Model<ReportReason> {

    /**
     * The name of the reason (short and precise)
     */
    @NotNull
    @Unique
    @Column({unique: true, allowNull: false, type: sqz.STRING(64)})
    public name: string;

    /**
     * A longer descripion of the reason
     */
    @NotNull
    @Column({allowNull: false, type: sqz.STRING(512)})
    public description: string;
}
