import * as sqz from "sequelize";
import {
    BelongsToMany,
    Column,
    CreatedAt,
    HasMany,
    Model,
    NotNull,
    Table,
    Unique,
    UpdatedAt,
} from "sequelize-typescript";
import * as uuidv4 from "uuid/v4";
import {RequestNotFoundError} from "../errors/RequestNotFoundError";
import {UserNotFoundError} from "../errors/UserNotFoundError";
import {ChatMember} from "./ChatMember";
import {ChatMessage} from "./ChatMessage";
import {ChatRoom} from "./ChatRoom";
import {Event} from "./Event";
import {EventParticipant} from "./EventParticipant";
import {Friendship} from "./Friendship";
import {Group} from "./Group";
import {GroupAdmin} from "./GroupAdmin";
import {GroupMember} from "./GroupMember";
import {Post} from "./Post";
import {PostVote} from "./PostVote";
import {Request, RequestType} from "./Request";

/**
 * A single user
 */
@Table({underscored: true})
export class User extends Model<User> {

    /**
     * The name of the user
     */
    @NotNull
    @Column({type: sqz.STRING(128), allowNull: false})
    public username: string;

    /**
     * The handle of the user
     */
    @NotNull
    @Unique
    @Column({type: sqz.STRING(128), allowNull: false, unique: true})
    public handle: string;

    /**
     * The email address of the user
     */
    @Unique
    @NotNull
    @Column({type: sqz.STRING(128), allowNull: false, unique: true})
    public email: string;

    /**
     * The password hash of the user
     */
    @NotNull
    @Column({type: sqz.STRING(128), allowNull: false})
    public password: string;

    /**
     * The ranking points of the user
     */
    @NotNull
    @Column({defaultValue: 0, allowNull: false})
    public rankpoints: number;

    /**
     * The JSON-Frontend settings of the user to provide a way to store custom settings in the backend
     */
    @NotNull
    @Column({defaultValue: {}, allowNull: false, type: sqz.JSON})
    public frontendSettings: any;

    /**
     * The auth token for bearer authentication
     */
    @Unique
    @Column({defaultValue: uuidv4, unique: true, type: sqz.UUID})
    public authToken: string;

    /**
     * The date and time the auth token expires
     */
    @Column({defaultValue: () => Date.now() + 7200000})
    public authExpire: Date;

    /**
     * A flag if the user is a site admin
     */
    @NotNull
    @Column({defaultValue: false, allowNull: false})
    public isAdmin: boolean;

    /**
     * The url of the users profile picture
     */
    @Column({type: sqz.STRING(512)})
    public profilePicture: string;

    /**
     * The friends of the user
     */
    @BelongsToMany(() => User, () => Friendship, "userId")
    public rFriends: User[];

    /**
     * The friends of the user
     */
    @BelongsToMany(() => User, () => Friendship, "friendId")
    public rFriendOf: User[];

    /**
     * The votes the user performed
     */
    @BelongsToMany(() => Post, () => PostVote)
    public votes: Array<Post & { PostVote: PostVote }>;

    /**
     * The chatrooms the user has joined
     */
    @BelongsToMany(() => ChatRoom, () => ChatMember)
    public rChats: ChatRoom[];

    /**
     * The group the user is an admin in
     */
    @BelongsToMany(() => Group, () => GroupAdmin)
    public rAdministratedGroups: Group[];

    /**
     * The events the user has joined
     */
    @BelongsToMany(() => Event, () => EventParticipant)
    public rEvents: Event[];

    /**
     * The groups the user has joined
     */
    @BelongsToMany(() => Group, () => GroupMember)
    public rGroups: Group[];

    /**
     * The posts the user has created
     */
    @HasMany(() => Post, "authorId")
    public rPosts: Post[];

    /**
     * The requests the user has sent
     */
    @HasMany(() => Request, "senderId")
    public rSentRequests: Request[];

    /**
     * The requests the user has received
     */
    @HasMany(() => Request, "receiverId")
    public rReceivedRequests: Request[];

    /**
     * The messages the user has sent in a chatroom
     */
    @HasMany(() => ChatMessage, "authorId")
    public messages: ChatMessage[];

    /**
     * The groups the user has created
     */
    @HasMany(() => Group, "creatorId")
    public rCreatedGroups: Group[];

    /**
     * The date the account was created
     */
    @CreatedAt
    public readonly createdAt!: Date;

    /**
     * The date of the last change to the user
     */
    @UpdatedAt
    public readonly updatedAt!: Date;

    /**
     * The name of the user
     */
    public get name(): string {
        return this.getDataValue("username");
    }

    /**
     * The date the user joined the network
     */
    public get joinedAt(): Date {
        return this.getDataValue("createdAt");
    }

    /**
     * The points of the user
     */
    public get points(): number {
        return this.getDataValue("rankpoints");
    }

    /**
     * The level of the user which is the points divided by 100
     */
    public get level(): number {
        return Math.ceil(this.getDataValue("rankpoints") / 100);
    }

    /**
     * returns the settings of the user as a jston string
     */
    public get settings(): string {
        return JSON.stringify(this.getDataValue("frontendSettings"));
    }

    /**
     * Returns the token for the user that can be used as a bearer in requests
     */
    public async token(): Promise<string> {
        if (this.getDataValue("authExpire") < new Date(Date.now())) {
            this.authToken = null;
            this.authExpire = null;
            await this.save();
        }
        return this.getDataValue("authToken");
    }

    /**
     * All friends of the user
     * @param first
     * @param offset
     */
    public async friends({first, offset}: { first: number, offset: number }): Promise<User[]> {
        const limit = first ?? 10;
        offset = offset ?? 0;
        return await this.$get("rFriendOf", {limit, offset}) as User[];
    }

    /**
     * The total number of the users friends.
     */
    public async friendCount(): Promise<number> {
        return this.$count("rFriends");
    }

    /**
     * The chats the user has joined
     * @param first
     * @param offset
     */
    public async chats({first, offset}: { first: number, offset: number }): Promise<ChatRoom[]> {
        const limit = first ?? 10;
        offset = offset ?? 0;
        return await this.$get("rChats", {limit, offset}) as ChatRoom[];
    }

    /**
     * the number of chats the user has
     */
    public async chatCount(): Promise<number> {
        return this.$count("rChats");
    }

    /**
     * All active requests the user ha ssent
     */
    public async sentRequests(): Promise<Request[]> {
        return await this.$get("rSentRequests") as Request[];
    }

    /**
     * All requests the user has received
     */
    public async receivedRequests(): Promise<Request[]> {
        return await this.$get("rReceivedRequests") as Request[];
    }

    /**
     * a list of posts the user has created
     * @param first
     * @param offset
     */
    public async posts({first, offset}: { first: number, offset: number }): Promise<Post[]> {
        const limit = first ?? 10;
        offset = offset ?? 0;
        return await this.$get("rPosts", {limit, offset}) as Post[];
    }

    /**
     * number of posts the user created
     */
    public async postCount(): Promise<number> {
        return this.$count("rPosts");
    }

    /**
     * Groups the user is the admin of
     */
    public async administratedGroups(): Promise<Group[]> {
        return await this.$get("rAdministratedGroups") as Group[];
    }

    /**
     * Groups the user has created
     */
    public async createdGroups(): Promise<Group[]> {
        return await this.$get("rCreatedGroups") as Group[];
    }

    /**
     * Groups the user is a member of
     * @param first
     * @param offset
     */
    public async groups({first, offset}: { first: number, offset: number }): Promise<Group[]> {
        const limit = first ?? 10;
        offset = offset ?? 0;
        return await this.$get("rGroups", {limit, offset}) as Group[];
    }

    /**
     * The number of groups the user has joined
     */
    public async groupCount(): Promise<number> {
        return this.$count("rGroups");
    }

    /**
     * Events the user has joined
     */
    public async events(): Promise<Event[]> {
        return await this.$get("rEvents") as Event[];
    }

    /**
     * The number of events the user is participating in.
     */
    public async eventCount(): Promise<number> {
        return this.$count("rEvents");
    }

    /**
     * Denys a request the user has received
     * @param sender
     * @param type
     */
    public async denyRequest(sender: number, type: RequestType) {
        const request = await this.$get("rReceivedRequests",
            {where: {senderId: sender, requestType: type}}) as Request[];
        if (request[0]) {
            await request[0].destroy();
        }
    }

    /**
     * Accepts a request the user has received
     * @param sender
     * @param type
     */
    public async acceptRequest(sender: number, type: RequestType) {
        const requests = await this.$get("rReceivedRequests",
            {where: {senderId: sender, requestType: type}}) as Request[];
        if (requests.length > 0) {
            const request = requests[0];
            if (request.requestType === RequestType.FRIENDREQUEST) {
                await Friendship.bulkCreate([
                    {userId: this.id, friendId: sender},
                    {userId: sender, friendId: this.id},
                ], {ignoreDuplicates: true});
                await request.destroy();
            }
        } else {
            throw new RequestNotFoundError(sender, this.id, type);
        }
    }

    /**
     * Removes a user from the users friends
     * @param friendId
     */
    public async removeFriend(friendId: number) {
        const friend = await User.findByPk(friendId);
        if (friend) {
            await this.$remove("rFriends", friend);
            await this.$remove("rFriendOf", friend);
            return true;
        } else {
            throw new UserNotFoundError(friendId);
        }
    }
}
