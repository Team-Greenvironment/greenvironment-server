import markdown from "../markdown";
import {Chatroom} from "./Chatroom";
import * as models from "./datamodels/models";
import {User} from "./User";

export class ChatMessage {

    public id: number;
    public content: string;
    public createdAt: Date;

    constructor(private message: models.ChatMessage) {
        this.id = message.id;
        this.content = message.content;
        this.createdAt = message.createdAt;
    }

    /**
     * returns the author of the chat message.
     */
    public async author(): Promise<User> {
        return new User(await this.message.getAuthor());
    }

    /**
     * Returns the rendered html content of the chat message.
     */
    public htmlContent(): string {
        return markdown.renderInline(this.content);
    }

    /**
     * returns the chatroom for the chatmessage.
     */
    public async chat(): Promise<Chatroom> {
        return (await this.message.getChat()).chatroom;
    }
}
