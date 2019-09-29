import {Chatroom} from "./Chatroom";
import {queryHelper} from "./index";
import {User} from "./User";

export class Profile extends User {

    /**
     * Returns all chatrooms (with pagination).
     * Skips the query if the user doesn't exist.
     * @param first
     * @param offset
     */
    public async chats({first, offset}: {first: number, offset?: number}): Promise<Chatroom[]> {
        if (!(await this.exists())) {
            return [];
        }
        first = first || 10;
        offset = offset || 0;

        const result = await queryHelper.all({
            text: "SELECT chat FROM chat_members WHERE member = $1 LIMIT $2 OFFSET $3",
            values: [this.id, first, offset],
        });
        if (result) {
            return result.map((row) => new Chatroom(row.chat));
        } else {
            return [];
        }
    }

    /**
     * Sets the greenpoints of a user.
     * @param points
     */
    public async setGreenpoints(points: number): Promise<number> {
        const result = await queryHelper.first({
            text: "UPDATE users SET greenpoints = $1 WHERE id = $2 RETURNING greenpoints",
            values: [points, this.id],
        });
        return result.greenpoints;
    }

    /**
     * Sets the email of the user
     * @param email
     */
    public async setEmail(email: string): Promise<string> {
        const result = await queryHelper.first({
            text: "UPDATE TABLE users SET email = $1 WHERE users.id = $2 RETURNING email",
            values: [email, this.id],
        });
        return result.email;
    }

    /**
     * Updates the handle of the user
     */
    public async setHandle(handle: string): Promise<string> {
        const result = await queryHelper.first({
            text: "UPDATE TABLE users SET handle = $1 WHERE id = $2",
            values: [handle, this.id],
        });
        return result.handle;
    }

    /**
     * Sets the username of the user
     * @param name
     */
    public async setName(name: string): Promise<string> {
        const result = await queryHelper.first({
            text: "UPDATE TABLE users SET name = $1 WHERE id = $2",
            values: [name, this.id],
        });
        return result.name;
    }
}
