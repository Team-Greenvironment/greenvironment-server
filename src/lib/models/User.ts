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

@Table({underscored: true})
export class User extends Model<User> {
    @NotNull
    @Column({type: sqz.STRING(128), allowNull: false})
    public username: string;

    @NotNull
    @Unique
    @Column({type: sqz.STRING(128), allowNull: false, unique: true})
    public handle: string;

    @Unique
    @NotNull
    @Column({type: sqz.STRING(128), allowNull: false, unique: true})
    public email: string;

    @NotNull
    @Column({type: sqz.STRING(128), allowNull: false})
    public password: string;

    @NotNull
    @Column({defaultValue: 0, allowNull: false})
    public rankpoints: number;

    @BelongsToMany(() => User, () => Friendship, "userId")
    public rFriends: User[];

    @BelongsToMany(() => User, () => Friendship, "friendId")
    public rFriendOf: User[];

    @BelongsToMany(() => Post, () => PostVote)
    public votes: Array<Post & { PostVote: PostVote }>;

    @BelongsToMany(() => ChatRoom, () => ChatMember)
    public rChats: ChatRoom[];

    @BelongsToMany(() => Group, () => GroupAdmin)
    public rAdministratedGroups: Group[];

    @BelongsToMany(() => Event, () => EventParticipant)
    public rEvents: Event[];

    @BelongsToMany(() => Group, () => GroupMember)
    public rGroups: Group[];

    @HasMany(() => Post, "authorId")
    public rPosts: Post[];

    @HasMany(() => Request, "senderId")
    public rSentRequests: Request[];

    @HasMany(() => Request, "receiverId")
    public rReceivedRequests: Request[];

    @HasMany(() => ChatMessage, "authorId")
    public messages: ChatMessage[];

    @HasMany(() => Group, "creatorId")
    public rCreatedGroups: Group[];

    @CreatedAt
    public readonly createdAt!: Date;

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
        return this.rankpoints;
    }

    /**
     * The level of the user which is the points divided by 100
     */
    public get level(): number {
        return Math.ceil(this.rankpoints / 100);
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

    public async posts({first, offset}: { first: number, offset: number }): Promise<Post[]> {
        const limit = first ?? 10;
        offset = offset ?? 0;
        return await this.$get("rPosts", {limit, offset}) as Post[];
    }

    /**
     * @deprecated
     * use {@link postCount} instead
     */
    public async numberOfPosts(): Promise<number> {
        return this.postCount();
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
