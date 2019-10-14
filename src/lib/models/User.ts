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

    @BelongsToMany(() => User, () => Friendship)
    public rFriends: User[];

    @BelongsToMany(() => Post, () => PostVote)
    public votes: Array<Post & {PostVote: PostVote}>;

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

    @HasMany(() => Request, "receiverId")
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

    public get name(): string {
        return this.getDataValue("username");
    }

    public get joinedAt(): Date {
        return this.getDataValue("createdAt");
    }

    public get points(): number {
        return this.rankpoints;
    }

    public get level(): number {
        return Math.ceil(this.rankpoints / 100);
    }

    public async friends(): Promise<User[]> {
        return await this.$get("rFriends") as User[];
    }

    public async chats(): Promise<ChatRoom[]> {
        return await this.$get("rChats") as ChatRoom[];
    }

    public async sentRequests(): Promise<Request[]> {
        return await this.$get("rSentRequests") as Request[];
    }

    public async receivedRequests(): Promise<Request[]> {
        return await this.$get("rReceivedRequests") as Request[];
    }

    public async posts({first, offset}: {first: number, offset: number}): Promise<Post[]> {
        return await this.$get("rPosts", {limit: first, offset}) as Post[];
    }

    public async numberOfPosts(): Promise<number> {
        return this.$count("rPosts");
    }

    public async administratedGroups(): Promise<Group[]> {
        return await this.$get("rAdministratedGroups") as Group[];
    }

    public async createdGroups(): Promise<Group[]> {
        return await this.$get("rCreatedGroups") as Group[];
    }

    public async groups(): Promise<Group[]> {
        return await this.$get("rGroups") as Group[];
    }

    public async events(): Promise<Event[]> {
        return await this.$get("rEvents") as Event[];
    }

    public async denyRequest(sender: number, type: RequestType) {
        const request = await this.$get("rReceivedRequests",
            {where: {senderId: sender, requestType: type}}) as Request[];
        if (request[0]) {
            await request[0].destroy();
        }
    }

    public async acceptRequest(sender: number, type: RequestType) {
        const requests = await this.$get("rReceivedRequests",
            {where: {senderId: sender, requestType: type}}) as Request[];
        if (requests.length > 0) {
            const request = requests[0];
            if (request.requestType === RequestType.FRIENDREQUEST) {
                await this.$add("friends", sender);
                await request.destroy();
            }
        } else {
            throw new RequestNotFoundError(sender, this.id, type);
        }
    }
}
