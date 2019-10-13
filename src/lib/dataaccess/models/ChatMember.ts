import {Column, ForeignKey, Model, Table,} from "sequelize-typescript";
import {ChatRoom} from "./ChatRoom";
import {User} from "./User";

@Table({underscored: true})
export class ChatMember extends Model<ChatMember> {
    @ForeignKey(() => User)
    @Column
    public userId: number;

    @ForeignKey(() => ChatRoom)
    @Column
    public chatId: number;
}
