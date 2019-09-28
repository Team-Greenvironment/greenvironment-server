import {ChatMessage} from "./ChatMessage";
import {queryHelper} from "./index";
import {User} from "./User";

export class Chatroom {

    constructor(private id: number) {}

    /**
     * Returns if the chat exists.
     */
    public async exists(): Promise<boolean> {
        const result = await queryHelper.first({
            text: "SELECT id FROM chats WHERE id = $1",
            values: [this.id],
        });
        return !!result.id;
    }

    /**
     * Returns all members of a chatroom.
     */
    public async members(): Promise<User[]> {
        const result = await queryHelper.all({
            text:  `SELECT * FROM chat_members
                    JOIN users ON (chat_members.member = users.id)
                    WHERE chat_members.chat = $1;`,
            values: [this.id],
        });
        const chatMembers = [];
        for (const row of result) {
            chatMembers.push(new User(row));
        }
        return chatMembers;
    }

    /**
     * Returns messages of the chat
     * @param limit - the limit of messages to return
     * @param offset - the offset of messages to return
     * @param containing - filter by containing
     */
    public async messages(limit?: number, offset?: number, containing?: string) {
        const lim = limit || 16;
        const offs = offset || 0;

        const result = await queryHelper.all({
            text: "SELECT * FROM chat_messages WHERE chat = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
            values: [this.id, lim, offs],
        });

        const messages = [];
        for (const row of result) {
            messages.push(new ChatMessage(new User(row.author), this, row.timestamp, row.content));
        }
        if (containing) {
            return messages.filter((x) => x.content.includes(containing));
        } else {
            return messages;
        }
    }
}
