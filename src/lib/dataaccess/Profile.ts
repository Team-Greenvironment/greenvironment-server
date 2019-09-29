import {RequestNotFoundError} from "../errors/RequestNotFoundError";
import {Chatroom} from "./Chatroom";
import dataaccess, {queryHelper} from "./index";
import {User} from "./User";
import {Request} from "./Request";

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
     * Returns all open requests the user has send.
     */
    public async sentRequests() {
        const result = await queryHelper.all({
            cache: true,
            text: "SELECT * FROM requests WHERE sender = $1",
            values: [this.id],
        });
        return this.getRequests(result);
    }

    /**
     * Returns all received requests of the user.
     */
    public async receivedRequests() {
        const result = await queryHelper.all({
            cache: true,
            text: "SELECT * FROM requests WHERE receiver = $1",
            values: [this.id],
        });
        return this.getRequests(result);
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
            text: "UPDATE users SET email = $1 WHERE users.id = $2 RETURNING email",
            values: [email, this.id],
        });
        return result.email;
    }

    /**
     * Updates the handle of the user
     */
    public async setHandle(handle: string): Promise<string> {
        const result = await queryHelper.first({
            text: "UPDATE users SET handle = $1 WHERE id = $2",
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
            text: "UPDATE users SET name = $1 WHERE id = $2",
            values: [name, this.id],
        });
        return result.name;
    }

    /**
     * Denys a request.
     * @param sender
     * @param type
     */
    public async denyRequest(sender: number, type: dataaccess.RequestType) {
        await queryHelper.first({
            text: "DELETE FROM requests WHERE receiver = $1 AND sender = $2 AND type = $3",
            values: [this.id, sender, type],
        });
    }

    /**
     * Accepts a request.
     * @param sender
     * @param type
     */
    public async acceptRequest(sender: number, type: dataaccess.RequestType) {
        const exists = await queryHelper.first({
            cache: true,
            text: "SELECT 1 FROM requests WHERE receiver = $1 AND sender = $2 AND type = $3",
            values: [this.id, sender, type],
        });
        if (exists) {
            if (type === dataaccess.RequestType.FRIENDREQUEST) {
                await queryHelper.first({
                    text: "INSERT INTO user_friends (user_id, friend_id) VALUES ($1, $2)",
                    values: [this.id, sender],
                });
            }
        } else {
            throw new RequestNotFoundError(sender, this.id, type);
        }
    }

    /**
     * Returns request wrapper for a row database request result.
     * @param rows
     */
    private getRequests(rows: any) {
        const requests = [];
        const requestUsers: any = {};

        for (const row of rows) {
            let sender = requestUsers[row.sender];

            if (!sender) {
                sender = new User(row.sender);
                requestUsers[row.sender] = sender;
            }
            let receiver = requestUsers[row.receiver];
            if (!receiver) {
                receiver = new User(row.receiver);
                requestUsers[row.receiver] = receiver;
            }
            requests.push(new Request(sender, receiver, row.type));
        }
        return requests;
    }
}
