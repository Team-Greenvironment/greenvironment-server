import {BelongsToMany, CreatedAt, HasMany, Model, Table} from "sequelize-typescript";
import {ChatMember} from "./ChatMember";
import {ChatMessage} from "./ChatMessage";
import {User} from "./User";

/**
 * The chatroom model
 */
@Table({underscored: true})
export class ChatRoom extends Model<ChatRoom> {

    /**
     * The members of the chatroom
     */
    @BelongsToMany(() => User, () => ChatMember)
    public rMembers: User[];

    /**
     * The messages in the chatroom
     */
    @HasMany(() => ChatMessage, "chatId")
    public rMessages: ChatMessage[];

    /**
     * The date the chatroom was created at
     */
    @CreatedAt
    public readonly createdAt!: Date;

    /**
     * Returns the members of the chatroom
     */
    public async members(): Promise<User[]> {
        return await this.$get("rMembers") as User[];
    }

    /**
     * Returns the messages that have been sent in the chatroom
     */
    public async messages({first, offset}: { first: number, offset: number }): Promise<ChatMessage[]> {
        const limit = first ?? 10;
        offset = offset ?? 0;
        return await this.$get("rMessages", {limit, offset}) as ChatMessage[];
    }

    /**
     * Returns the namespace of the websocket of the chatroom
     */
    public get namespace(): string {
        return "/chats/" + this.getDataValue("id");
    }
}
