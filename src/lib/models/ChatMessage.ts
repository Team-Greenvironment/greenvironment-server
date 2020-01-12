import * as sqz from "sequelize";
import {BelongsTo, Column, CreatedAt, ForeignKey, Model, NotNull, Table} from "sequelize-typescript";
import markdown from "../markdown";
import {ChatRoom} from "./ChatRoom";
import {User} from "./User";

/**
 * A single chat message in a chatroom
 */
@Table({underscored: true})
export class ChatMessage extends Model<ChatMessage> {

    /**
     * The content of a message in markdown utf-8 format
     */
    @NotNull
    @Column({type: sqz.STRING(512), allowNull: false})
    public content: string;

    /**
     * The id of the chatroom the message was sent in
     */
    @ForeignKey(() => ChatRoom)
    @NotNull
    @Column({allowNull: false})
    public chatId: number;

    /**
     * The id of the author of the message
     */
    @ForeignKey(() => User)
    @NotNull
    @Column({allowNull: false})
    public authorId: number;

    /**
     * The chatroom the message belongs to
     */
    @BelongsTo(() => ChatRoom, "chatId")
    public rChat: ChatRoom;

    /**
     * The author the message belongs to
     */
    @BelongsTo(() => User, "authorId")
    public rAuthor: User;

    /**
     * The date when the message was created
     */
    @CreatedAt
    public createdAt: Date;

    /**
     * Returns the chatroom of the message
     */
    public async chat(): Promise<ChatRoom> {
        return await this.$get("rChat") as ChatRoom;
    }

    /**
     * Returns the author of the message
     */
    public async author(): Promise<User> {
        return await this.$get("rAuthor") as User;
    }

    /**
     * Returns the rendered html content of the message.
     * Rendered by markdown.it
     */
    public get htmlContent(): string {
        return markdown.renderInline(this.getDataValue("content"));
    }
}
