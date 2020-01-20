import * as sqz from "sequelize";
import {Column, Model, NotNull, Table, Unique} from "sequelize-typescript";

/**
 * Represents a blacklisted phrase
 */
@Table({underscored: true})
export class BlacklistedPhrase extends Model {

    /**
     * The phrase that is blacklisted
     */
    @NotNull
    @Unique
    @Column({allowNull: false, unique: true})
    public phrase: string;

    /**
     * An optional language
     */
    @Column({type: sqz.STRING(2), defaultValue: "en"})
    public language: string;
}
