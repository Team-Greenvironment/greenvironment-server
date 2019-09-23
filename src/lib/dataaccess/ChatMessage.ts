import {Chatroom} from "./Chatroom";
import {User} from "./User";

export class ChatMessage {
    constructor(public author: User, public chat: Chatroom, public timestamp: number, public content: string) {
    }
}
