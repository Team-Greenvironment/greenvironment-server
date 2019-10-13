import * as sqz from "sequelize";
import {BelongsTo, Column, CreatedAt, ForeignKey, Model, Table,} from "sequelize-typescript";
import markdown from "../../markdown";
import {ChatRoom} from "./ChatRoom";
import {User} from "./User";

@Table({underscored: true})
export class ChatMessage extends Model<ChatMessage> {

    @Column(sqz.STRING(512))
    public content: string;

    @ForeignKey(() => ChatRoom)
    @Column
    public chatId: number;

    @ForeignKey(() => User)
    @Column
    public authorId: number;

    @BelongsTo(() => ChatRoom, "chatId")
    public rChat: ChatRoom;

    @BelongsTo(() => User, "authorId")
    public rAuthor: User;

    @CreatedAt
    public createdAt: Date;

    public async chat(): Promise<ChatRoom> {
        return await this.$get("rChat") as ChatRoom;
    }

    public async author(): Promise<User> {
        return await this.$get("rAuthor") as User;
    }

    public get htmlContent(): string {
        return markdown.renderInline(this.getDataValue("content"));
    }
}
