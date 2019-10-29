import {BelongsToMany, CreatedAt, HasMany, Model, Table,} from "sequelize-typescript";
import {ChatMember} from "./ChatMember";
import {ChatMessage} from "./ChatMessage";
import {User} from "./User";

@Table({underscored: true})
export class ChatRoom extends Model<ChatRoom> {
    @BelongsToMany(() => User, () => ChatMember)
    public rMembers: User[];

    @HasMany(() => ChatMessage, "chatId")
    public rMessages: ChatMessage[];

    @CreatedAt
    public readonly createdAt!: Date;

    public async members(): Promise<User[]> {
        return await this.$get("rMembers") as User[];
    }

    public async messages(): Promise<ChatMessage[]> {
        return await this.$get("rMessages") as ChatMessage[];
    }

    public get namespace(): string {
        return "/chats/" + this.getDataValue("id");
    }
}
