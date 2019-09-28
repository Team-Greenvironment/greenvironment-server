import markdown from "../markdown";
import {Chatroom} from "./Chatroom";
import {User} from "./User";

export class ChatMessage {
    constructor(public author: User, public chat: Chatroom, public timestamp: number, public content: string) {
    }

    /**
     * The content rendered by markdown-it.
     */
    public htmlContent(): string {
        return markdown.renderInline(this.content);
    }
}
