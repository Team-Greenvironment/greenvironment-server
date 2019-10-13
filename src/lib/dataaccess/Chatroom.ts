import {SqChat} from "./datamodels";
import {User} from "./User";

export class Chatroom {

    public readonly id: number;
    public namespace: string;

    constructor(private chat: SqChat) {
        this.id = chat.id;
        this.namespace = `/chat/${chat.id}`;
    }

    /**
     * Returns all members of a chatroom.
     */
    public async members(): Promise<User[]> {
        const members = await this.chat.getMembers();
        return members.map((m) => new User(m));
    }

    /**
     * Returns messages of the chat
     * @param limit - the limit of messages to return
     * @param offset - the offset of messages to return
     * @param containing - filter by containing
     */
    public async messages({first, offset, containing}: { first?: number, offset?: number, containing?: string }) {
        const lim = first || 16;
        const offs = offset || 0;
        const messages = await this.chat.getMessages({limit: lim, offset: offs});
        if (containing) {
            return messages.filter((x) => x.content.includes(containing)).map((m) => m.message);
        } else {
            return messages.map((m) => m.message);
        }
    }
}
