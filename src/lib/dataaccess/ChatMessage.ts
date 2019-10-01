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

    /**
     * Returns resolved and rendered content of the chat message.
     */
    public resolvedContent() {
        return {
            author: this.author.id,
            chat: this.chat.id,
            content: this.content,
            createdAt: this.createdAt,
            htmlContent: this.htmlContent(),
        };
    }
}
