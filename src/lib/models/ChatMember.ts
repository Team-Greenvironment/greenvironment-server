import {Column, ForeignKey, Model, NotNull, Table} from "sequelize-typescript";
import {ChatRoom} from "./ChatRoom";
import {User} from "./User";

/**
 * Represents a member of a chat
 */
@Table({underscored: true})
export class ChatMember extends Model<ChatMember> {
    /**
     * The id of the user
     */
    @ForeignKey(() => User)
    @NotNull
    @Column({allowNull: false})
    public userId: number;

    /**
     * The id of the chatroom
     */
    @ForeignKey(() => ChatRoom)
    @NotNull
    @Column({allowNull: false})
    public chatId: number;
}
