import * as sqz from "sequelize";
import {BelongsTo, Column, ForeignKey, Model, NotNull, Table} from "sequelize-typescript";
import {User} from "./User";

/**
 * An enum that represents all possible types of requests
 */
export enum RequestType {
    FRIENDREQUEST = "FRIENDREQUEST",
    GROUPINVITE = "GROUPINVITE",
    EVENTINVITE = "EVENTINVITE",
}

/**
 * A single request for a friendship, group invide, event invite
 */
@Table({underscored: true})
export class Request extends Model<Request> {

    /**
     * The type of the request
     */
    @NotNull
    @Column({
        allowNull: false,
        defaultValue: "FRIENDREQUEST",
        type: sqz.ENUM,
        values: ["FRIENDREQUEST", "GROUPINVITE", "EVENTINVITE"],
    })
    public requestType: RequestType;

    /**
     * The id of the user who sent the request
     */
    @ForeignKey(() => User)
    @NotNull
    @Column({allowNull: false})
    public senderId: number;

    /**
     * The user who sent the request
     */
    @BelongsTo(() => User, "senderId")
    public rSender: User;

    /**
     * The id of the user who received the request
     */
    @ForeignKey(() => User)
    @NotNull
    @Column({allowNull: false})
    public receiverId: number;

    /**
     * The user who received the request
     */
    @BelongsTo(() => User, "receiverId")
    public rReceiver: User;

    /**
     * Wrapper to return the request type for the request
     */
    public get type(): RequestType {
        return this.requestType;
    }

    /**
     * The receiver of the request
     */
    public async receiver(): Promise<User> {
        return await this.$get("rReceiver") as User;
    }

    /**
     * The sender of the request.
     */
    public async sender(): Promise<User> {
        return await this.$get("rSender") as User;
    }
}
