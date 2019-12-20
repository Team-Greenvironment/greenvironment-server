import {Column, ForeignKey, Model, NotNull, Table} from "sequelize-typescript";
import {ChatRoom} from "./ChatRoom";
import {User} from "./User";

@Table({underscored: true})
export class ChatMember extends Model<ChatMember> {
    @ForeignKey(() => User)
    @NotNull
    @Column({allowNull: false})
    public userId: number;

    @ForeignKey(() => ChatRoom)
    @NotNull
    @Column({allowNull: false})
    public chatId: number;
}
