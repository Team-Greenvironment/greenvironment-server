import markdown from "../markdown";
import {Chatroom} from "./Chatroom";
import {User} from "./User";

export class ChatMessage {
    constructor(
        public readonly author: User,
        public readonly chat: Chatroom,
        public readonly createdAt: number,
        public readonly content: string) {}

    /**
     * The content rendered by markdown-it.
     */
    public htmlContent(): string {
        return markdown.renderInline(this.content);
    }
}
