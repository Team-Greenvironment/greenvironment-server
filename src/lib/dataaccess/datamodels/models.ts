// tslint:disable:object-literal-sort-keys

import * as sqz from "sequelize";
import {
    Association,
    BelongsToGetAssociationMixin,
    BelongsToManyAddAssociationMixin,
    BelongsToManyCountAssociationsMixin,
    BelongsToManyCreateAssociationMixin,
    BelongsToManyGetAssociationsMixin,
    BelongsToManyHasAssociationMixin,
    DataTypes,
    HasManyAddAssociationMixin,
    HasManyCountAssociationsMixin,
    HasManyCreateAssociationMixin,
    HasManyGetAssociationsMixin,
    HasManyHasAssociationMixin,
    HasOneGetAssociationMixin,
    Model,
    Sequelize,
} from "sequelize";
import * as wrappers from "../wrappers";

const underscored = true;

enum VoteType {
    UPVOTE = "UPVOTE",
    DOWNVOTE = "DOWNVOTE",
}

export enum RequestType {
    FRIENDREQUEST = "FRIENDREQUEST",
    GROUPINVITE = "GROUPINVITE",
    EVENTINVITE = "EVENTINVITE",
}

export class User extends Model {

    public static associations: {
        friends: Association<User, User>;
        posts: Association<User, Post>;
        votes: Association<User, PostVotes>;
        requests: Association<User, Request>;
    };

    public id!: number;
    public username!: string;
    public handle!: string;
    public email!: string;
    public password!: string;
    public rankpoints!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public getFriends!: HasManyGetAssociationsMixin<User>;
    public addFriend!: HasManyAddAssociationMixin<User, number>;
    public hasFriend!: HasManyHasAssociationMixin<User, number>;
    public countFriends!: HasManyCountAssociationsMixin;

    public getPosts!: HasManyGetAssociationsMixin<Post>;
    public addPost!: HasManyAddAssociationMixin<Post, number>;
    public hasPost!: HasManyHasAssociationMixin<Post, number>;
    public countPosts!: HasManyCountAssociationsMixin;
    public createPost!: HasManyCreateAssociationMixin<Post>;

    public getReceivedRequests!: HasManyGetAssociationsMixin<Request>;
    public addReceivedRequest!: HasManyAddAssociationMixin<Request, number>;
    public hasReceivedRequest!: HasManyHasAssociationMixin<Request, number>;
    public countReceivedRequests!: HasManyCountAssociationsMixin;
    public createReceivedRequest!: HasManyCreateAssociationMixin<Request>;


    public getSentRequests!: HasManyGetAssociationsMixin<Request>;
    public addSentRequest!: HasManyAddAssociationMixin<Request, number>;
    public hasSentRequest!: HasManyHasAssociationMixin<Request, number>;
    public countSentRequests!: HasManyCountAssociationsMixin;
    public createSentRequest!: HasManyCreateAssociationMixin<Request>;

    public getChats!: BelongsToManyGetAssociationsMixin<Chat>;
    public addChat!: BelongsToManyAddAssociationMixin<Chat, number>;
    public hasChat!: BelongsToManyHasAssociationMixin<Chat, number>;
    public countChats!: BelongsToManyCountAssociationsMixin;
    public createChat!: BelongsToManyCreateAssociationMixin<Chat>;

    /**
     * Getter for joined at as the date the entry was created.
     */
    public get joinedAt(): Date {
        // @ts-ignore
        return this.getDataValue("createdAt");
    }

    /**
     * Wraps itself into a user
     */
    public get user(): wrappers.User {
        return new wrappers.User(this);
    }

    /**
     * returns the username.
     */
    public get name(): string {
        return this.getDataValue("username");
    }

    /**
     * Wraps itself into a profile.
     */
    public get profile(): wrappers.Profile {
        return new wrappers.Profile(this);
    }
}

export class UserFriends extends Model {
}

export class Post extends Model {

    public static associations: {
        author: Association<Post, User>,
        votes: Association<Post, PostVotes>,
    };

    public id!: number;
    public content!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public getUser!: BelongsToGetAssociationMixin<User>;

    public getVotes!: HasManyGetAssociationsMixin<PostVotes>;
    public addVote!: HasManyAddAssociationMixin<PostVotes, number>;
    public hasVote!: HasManyHasAssociationMixin<PostVotes, number>;
    public countVotes!: HasManyCountAssociationsMixin;
    public createVote!: HasManyCreateAssociationMixin<PostVotes>;

    /**
     * Wraps itself into a Post instance.
     */
    public get post(): wrappers.Post {
        return new wrappers.Post(this);
    }
}

export class PostVotes extends Model {
    public voteType: VoteType;
}

export class Request extends Model {
    public id!: number;
    public requestType!: RequestType;

    public getSender!: HasOneGetAssociationMixin<User>;
    public getReceiver!: HasOneGetAssociationMixin<User>;
}

export class Chat extends Model {
    public static associations: {
        members: Association<Chat, User>,
        messages: Association<Chat, ChatMessage>,
    };

    public id!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public getMembers!: BelongsToManyGetAssociationsMixin<User>;
    public addMember!: BelongsToManyAddAssociationMixin<User, number>;
    public hasMember!: BelongsToManyHasAssociationMixin<User, number>;
    public countMembers!: BelongsToManyCountAssociationsMixin;

    public getMessages!: HasManyGetAssociationsMixin<ChatMessage>;
    public addMessage!: HasManyAddAssociationMixin<ChatMessage, number>;
    public hasMessage!: HasManyHasAssociationMixin<ChatMessage, number>;
    public countMessages!: HasManyCountAssociationsMixin;
    public createMessage!: HasManyCreateAssociationMixin<ChatMessage>;

    /**
     * wraps itself into a chatroom.
     */
    public get chatroom(): wrappers.Chatroom {
        return new wrappers.Chatroom(this);
    }
}

export class ChatMembers extends Model {
}

export class ChatMessage extends Model {
    public id: number;
    public content!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public getAuthor!: BelongsToGetAssociationMixin<User>;
    public getChat!: BelongsToGetAssociationMixin<Chat>;

    public get message(): wrappers.ChatMessage {
        return new wrappers.ChatMessage(this);
    }
}

export function init(sequelize: Sequelize) {
    User.init({
        username: {
            allowNull: false,
            type: sqz.STRING(128),
        },
        handle: {
            allowNull: false,
            type: sqz.STRING(128),
            unique: true,
        },
        email: {
            allowNull: false,
            type: sqz.STRING(128),
            unique: true,
        },
        password: {
            allowNull: false,
            type: sqz.STRING(128),
        },
        rankpoints: {
            allowNull: false,
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    }, {sequelize, underscored});

    UserFriends.init({}, {sequelize, underscored});

    Post.init({
        content: DataTypes.TEXT,
    }, {sequelize, underscored});

    PostVotes.init({
        voteType: {
            type: DataTypes.ENUM,
            values: ["UPVOTE", "DOWNVOTE"],
        },
    }, {sequelize, underscored});

    Request.init({
        requestType: {
            type: DataTypes.ENUM,
            values: ["FRIENDREQUEST", "GROUPINVITE", "EVENTINVITE"],
        },
    }, {sequelize, underscored});

    Chat.init({}, {sequelize, underscored});

    ChatMembers.init({}, {sequelize, underscored});

    ChatMessage.init({
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    }, {sequelize, underscored});

    User.belongsToMany(User, {through: UserFriends, as: "friends"});
    Post.belongsTo(User, {foreignKey: "userId"});
    User.hasMany(Post, {as: "posts", foreignKey: "userId"});
    Post.belongsToMany(User, {through: PostVotes, as: "votes"});
    User.belongsToMany(Post, {through: PostVotes, as: "votes"});
    User.hasMany(Request, {as: "sentRequests"});
    User.hasMany(Request, {as: "receivedRequests"});
    User.belongsToMany(Chat, {through: ChatMembers});
    Chat.belongsToMany(User, {through: ChatMembers, as: "members"});
    Chat.hasMany(ChatMessage, {as: "messages"});
    ChatMessage.belongsTo(Chat);
    ChatMessage.belongsTo(User, {as: "author", foreignKey: "userId"});
    User.hasMany(ChatMessage, {foreignKey: "userId"});
}

