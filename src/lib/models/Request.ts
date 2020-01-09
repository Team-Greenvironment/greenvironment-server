import * as sqz from "sequelize";
import {BelongsTo, Column, ForeignKey, Model, NotNull, Table} from "sequelize-typescript";
import {User} from "./User";

export enum RequestType {
    FRIENDREQUEST = "FRIENDREQUEST",
    GROUPINVITE = "GROUPINVITE",
    EVENTINVITE = "EVENTINVITE",
}

@Table({underscored: true})
export class Request extends Model<Request> {
    @NotNull
    @Column({
        allowNull: false,
        defaultValue: "FRIENDREQUEST",
        type: sqz.ENUM,
        values: ["FRIENDREQUEST", "GROUPINVITE", "EVENTINVITE"],
    })
    public requestType: RequestType;

    @ForeignKey(() => User)
    @NotNull
    @Column({allowNull: false})
    public senderId: number;

    @BelongsTo(() => User, "senderId")
    public rSender: User;

    @ForeignKey(() => User)
    @NotNull
    @Column({allowNull: false})
    public receiverId: number;

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
