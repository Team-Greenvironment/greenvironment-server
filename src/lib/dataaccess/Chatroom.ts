import globals from "../globals";
import {ChatMessage} from "./ChatMessage";
import {queryHelper} from "./index";
import {User} from "./User";

export class Chatroom {

    public namespace: string;
    constructor(public readonly id: number) {
        this.id = Number(id);
        this.namespace = `/chat/${id}`;
    }

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
            cache: true,
            text:  `SELECT * FROM chat_members
                    JOIN users ON (chat_members.member = users.id)
                    WHERE chat_members.chat = $1;`,
            values: [this.id],
        });
        const chatMembers = [];
        for (const row of result) {
            const user = new User(row.id, row);
            chatMembers.push(user);
        }
        return chatMembers;
    }

    /**
     * Returns messages of the chat
     * @param limit - the limit of messages to return
     * @param offset - the offset of messages to return
     * @param containing - filter by containing
     */
    public async messages({first, offset, containing}: {first?: number, offset?: number, containing?: string}) {
        const lim = first || 16;
        const offs = offset || 0;

        const result = await queryHelper.all({
            cache: true,
            text: "SELECT * FROM chat_messages WHERE chat = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
            values: [this.id, lim, offs],
        });

        const messages = [];
        const users: any = {};
        for (const row of result) {
            if (!users[row.author]) {
                const user = new User(row.author);
                await user.exists();
                users[row.author] = user;
            }
            messages.push(new ChatMessage(users[row.author], this, row.created_at, row.content));
        }
        if (containing) {
            return messages.filter((x) => x.content.includes(containing));
        } else {
            return messages;
        }
    }
}
