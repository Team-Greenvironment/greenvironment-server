import * as sqz from "sequelize";
import {BelongsTo, Column, ForeignKey, Model, NotNull, Table,} from "sequelize-typescript";
import {User} from "./User";

export enum RequestType {
    FRIENDREQUEST = "FRIENDREQUEST",
    GROUPINVITE = "GROUPINVITE",
    EVENTINVITE = "EVENTINVITE",
}

@Table({underscored: true})
export class Request extends Model<Request> {
    @NotNull
    @Column({type: sqz.ENUM, values: ["FRIENDREQUEST", "GROUPINVITE", "EVENTINVITE"],
        defaultValue: "FRIENDREQUEST", allowNull: false})
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

    public async receiver(): Promise<User> {
        return await this.$get("rReceiver") as User;
    }

    public async sender(): Promise<User> {
        return await this.$get("rSender") as User;
    }
}
