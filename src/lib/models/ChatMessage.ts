import * as sqz from "sequelize";
import {BelongsTo, Column, CreatedAt, ForeignKey, Model, NotNull, Table,} from "sequelize-typescript";
import markdown from "../markdown";
import {ChatRoom} from "./ChatRoom";
import {User} from "./User";

@Table({underscored: true})
export class ChatMessage extends Model<ChatMessage> {

    @NotNull
    @Column({type: sqz.STRING(512), allowNull: false})
    public content: string;

    @ForeignKey(() => ChatRoom)
    @NotNull
    @Column({allowNull: false})
    public chatId: number;

    @ForeignKey(() => User)
    @NotNull
    @Column({allowNull: false})
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
