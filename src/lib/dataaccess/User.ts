import {SqUser} from "./datamodels";
import * as wrappers from "./wrappers";

export class User {
    public id: number;
    public name: string;
    public handle: string;
    public greenpoints: number;
    public joinedAt: Date;

    protected user: SqUser;

    constructor(user: SqUser) {
        this.id = user.id;
        this.name = user.username;
        this.handle = user.handle;
        this.greenpoints = user.rankpoints;
        this.joinedAt = user.joinedAt;
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
    public async friends(): Promise<User[]> {
        const result = await this.user.getFriends();
        const userFriends = [];
        for (const friend of result) {
            userFriends.push(new User(friend));
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
}
