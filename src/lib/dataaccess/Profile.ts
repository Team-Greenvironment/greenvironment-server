import {RequestNotFoundError} from "../errors/RequestNotFoundError";
import {Chatroom} from "./Chatroom";
import {SqUser} from "./datamodels";
import dataaccess from "./index";
import * as wrappers from "./wrappers";

export class Profile {

    public id: number;
    public name: string;
    public handle: string;
    public email: string;
    public greenpoints: number;
    public joinedAt: Date;

    protected user: SqUser;

    constructor(user: SqUser) {
        this.name = user.username;
        this.handle = user.handle;
        this.email = user.email;
        this.greenpoints = user.rankpoints;
        this.joinedAt = user.joinedAt;
        this.id = user.id;
        this.user = user;
    }

    /**
     * Returns the number of posts the user created
     */
    public async numberOfPosts(): Promise<number> {
        return this.user.countPosts();
    }

    /**
     * Returns all friends of the user.
     */
    public async friends(): Promise<wrappers.User[]> {
        const result = await this.user.getFriends();
        const userFriends = [];
        for (const friend of result) {
            userFriends.push(new wrappers.User(friend));
        }
        return userFriends;
    }

    /**
     * Returns all posts for a user.
     */
    public async posts({first, offset}: { first: number, offset: number }): Promise<wrappers.Post[]> {
        const postRes = await this.user.getPosts();
        const posts = [];

        for (const post of postRes) {
            posts.push(new wrappers.Post(post));
        }
        return posts;
    }

    /**
     * Returns all chatrooms (with pagination).
     * Skips the query if the user doesn't exist.
     * @param first
     * @param offset
     */
    public async chats({first, offset}: { first: number, offset?: number }): Promise<Chatroom[]> {
        first = first || 10;
        offset = offset || 0;

        const result = await this.user.getChats();

        if (result) {
            return result.map((chat) => new Chatroom(chat));
        } else {
            return [];
        }
    }

    /**
     * Returns all open requests the user has send.
     */
    public async sentRequests() {
        return this.user.getSentRequests();
    }

    /**
     * Returns all received requests of the user.
     */
    public async receivedRequests() {
        return this.user.getReceivedRequests();
    }

    /**
     * Sets the greenpoints of a user.
     * @param points
     */
    public async setGreenpoints(points: number): Promise<number> {
        this.user.rankpoints = points;
        await this.user.save();
        return this.user.rankpoints;
    }

    /**
     * Sets the email of the user
     * @param email
     */
    public async setEmail(email: string): Promise<string> {
        this.user.email = email;
        await this.user.save();
        return this.user.email;
    }

    /**
     * Updates the handle of the user
     */
    public async setHandle(handle: string): Promise<string> {
        this.user.handle = handle;
        await this.user.save();
        return this.user.handle;
    }

    /**
     * Sets the username of the user
     * @param name
     */
    public async setName(name: string): Promise<string> {
        this.user.username = name;
        await this.user.save();
        return this.user.username;
    }

    /**
     * Denys a request.
     * @param sender
     * @param type
     */
    public async denyRequest(sender: number, type: dataaccess.RequestType) {
        const request = await this.user.getReceivedRequests({where: {senderId: sender, requestType: type}});
        if (request[0]) {
            await request[0].destroy();
        }
    }

    /**
     * Accepts a request.
     * @param sender
     * @param type
     */
    public async acceptRequest(sender: number, type: dataaccess.RequestType) {
        const requests = await this.user.getReceivedRequests({where: {senderId: sender, requestType: type}});
        if (requests.length > 0) {
            const request = requests[0];
            if (request.requestType === dataaccess.RequestType.FRIENDREQUEST) {
                await this.user.addFriend(sender);
                await request.destroy();
            }
        } else {
            throw new RequestNotFoundError(sender, this.id, type);
        }
    }
}
