import {GraphQLError} from "graphql";
import * as yaml from "js-yaml";
import sequelize from "sequelize";
import isEmail from "validator/lib/isEmail";
import dataAccess from "../../lib/dataAccess";
import {BlacklistedError} from "../../lib/errors/BlacklistedError";
import {GroupNotFoundError} from "../../lib/errors/GroupNotFoundError";
import {HandleInUseError} from "../../lib/errors/HandleInUseError";
import {InvalidEmailError} from "../../lib/errors/InvalidEmailError";
import {LevelAlreadyExistsError} from "../../lib/errors/LevelAlreadyExistsError";
import {NotAGroupAdminError} from "../../lib/errors/NotAGroupAdminError";
import {NotAnAdminError} from "../../lib/errors/NotAnAdminError";
import {NotTheGroupCreatorError} from "../../lib/errors/NotTheGroupCreatorError";
import {PostNotFoundError} from "../../lib/errors/PostNotFoundError";
import {ReportAlreadyExistsError} from "../../lib/errors/ReportAlreadyExistsError";
import {ReportReasonNameAlreadyExistsError} from "../../lib/errors/ReportReasonNameAlreadyExistsError";
import {ReportReasonNotFoundError} from "../../lib/errors/ReportReasonNotFoundError";
import globals from "../../lib/globals";
import {InternalEvents} from "../../lib/InternalEvents";
import {
    Activity,
    BlacklistedPhrase,
    ChatMessage,
    ChatRoom,
    Event,
    Group,
    Level,
    Post,
    Request,
    User,
} from "../../lib/models";
import {Report} from "../../lib/models";
import {ReportReason} from "../../lib/models";
import {is} from "../../lib/regex";
import {UploadManager} from "../../lib/UploadManager";
import {BaseResolver} from "./BaseResolver";

const legit = require("legit");

/**
 * A class that provides methods to resolve mutations
 */
export class MutationResolver extends BaseResolver {

    /**
     * An instance of the upload manager to handle uploads
     */
    protected uploadManager: UploadManager;

    constructor() {
        super();
        this.uploadManager = new UploadManager();
    }


    /**
     * Accepts the usage of cookies and stores the session
     * @param args
     * @param request
     */
    public acceptCookies(args: null, request: any): boolean {
        request.session.cookiesAccepted = true;
        return true;
    }

    /**
     * Loggs in and appends the user id to the session
     * @param email
     * @param passwordHash
     * @param request
     */
    public async login({email, passwordHash}: { email: string, passwordHash: string }, request: any): Promise<User> {
        const user = await dataAccess.getUserByLogin(email, passwordHash);
        request.session.userId = user.id;
        return user;
    }

    /**
     * Loggs out by removing the user from the session
     * @param args
     * @param request
     */
    public logout(args: null, request: any) {
        this.ensureLoggedIn(request);
        delete request.session.userId;
        request.session.save((err: any) => {
            if (err) {
                globals.logger.error(err.message);
                globals.logger.debug(err.stack);
            }
        });
    }

    /**
     * Registers a new user account
     * @param username
     * @param email
     * @param passwordHash
     * @param request
     */
    public async register({username, email, passwordHash}: { username: string, email: string, passwordHash: string },
                          request: any): Promise<User> {
        if (username?.length === 0 || email?.length === 0 || passwordHash?.length === 0) {
            throw new GraphQLError("No username or email or password given.");
        }
        let mailValid = is.email(email);
        if (mailValid) {
            try {
                mailValid = (await legit(email)).isValid;
            } catch (err) {
                globals.logger.warn(`Mail legit check returned: ${err.message}`);
                globals.logger.debug(err.stack);
                mailValid = false;
            }
        }
        if (!mailValid) {
            throw new InvalidEmailError(email);
        }
        const user = await dataAccess.registerUser(username, email, passwordHash);
        request.session.userId = user.id;
        return user;
    }

    /**
     * Sets a new username for a user
     * @param username
     * @param request
     */
    public async setUsername({username}: {username: string}, request: any): Promise<User> {
        this.ensureLoggedIn(request);
        const user = await User.findByPk(request.session.userId);
        user.username = username;
        await user.save();
        return user;
    }

    /**
     * Sets a new handle for the user. If the handle is alredy used by a different user, an error is returned
     * @param handle
     * @param request
     */
    public async setHandle({handle}: {handle: string}, request: any): Promise<User> {
        this.ensureLoggedIn(request);
        const user = await User.findByPk(request.session.userId);
        const handleAvailable = !(await User.findOne({where: {handle}}));
        if (!handleAvailable) {
            throw new HandleInUseError(handle);
        }
        user.handle = handle;
        await user.save();
        return user;
    }

    /**
     * Sets the frontend settings for the logged in user
     * @param settings
     * @param request
     */
    public async setUserSettings({settings}: { settings: string }, request: any): Promise<string> {
        this.ensureLoggedIn(request);
        const user = await User.findByPk(request.session.userId);
        try {
            user.frontendSettings = yaml.safeLoad(settings);
            await user.save();
            return user.settings;
        } catch (err) {
            globals.logger.warning(err.message);
            globals.logger.debug(err.stack);
            throw new GraphQLError("Invalid settings json.");
        }
    }

    /**
     * Toggles a vote of a specific type on a post and returns the post and the result
     * @param postId
     * @param type
     * @param request
     */
    public async vote({postId, type}: { postId: number, type: dataAccess.VoteType }, request: any):
        Promise<{ post: Post, voteType: dataAccess.VoteType }> {
        this.ensureLoggedIn(request);
        const post = await Post.findByPk(postId);
        if (post) {
            const voteType = await post.vote(request.session.userId, type);
            return {
                post,
                voteType,
            };
        } else {
            throw new PostNotFoundError(postId);
        }
    }

    /**
     * Creates a new post
     * @param content
     * @param activityId
     * @param type
     * @param request
     */
    public async createPost(
        {content, activityId, type}: { content: string, activityId?: number, type: dataAccess.PostType },
        request: any): Promise<Post> {
        this.ensureLoggedIn(request);
        if (content.length > 2048) {
            throw new GraphQLError("Content too long.");
        }
        const post = await dataAccess.createPost(content, request.session.userId, activityId, type);
        globals.internalEmitter.emit(InternalEvents.GQLPOSTCREATE, post);
        return post;
    }

    /**
     * Deletes a post if the user is either the author or a site admin.
     * @param postId
     * @param request
     */
    public async deletePost({postId}: { postId: number }, request: any): Promise<boolean> {
        this.ensureLoggedIn(request);
        const post = await Post.findByPk(postId, {
            include: [{
                as: "rAuthor",
                model: User,
            }],
        });
        const isAdmin = (await User.findOne({where: {id: request.session.userId}})).isAdmin;
        if (post.rAuthor.id === request.session.userId || isAdmin) {
            return await dataAccess.deletePost(post.id);
        } else {
            throw new GraphQLError("User is not author of the post.");
        }
    }

    /**
     * Reports a post
     * @param postId
     * @param reasonId
     * @param request
     */
    public async reportPost({postId, reasonId}: {postId: number, reasonId: number}, request: any): Promise<Report> {
        this.ensureLoggedIn(request);
        const post = await Post.findByPk(postId);
        if (!post) {
            throw new PostNotFoundError(postId);
        }
        const reason = await ReportReason.findByPk(reasonId);
        if (!reason) {
            throw new ReportReasonNotFoundError(reasonId);
        }
        const report = await Report.findOne({where: {postId, reasonId, userId: request.session.userId}});
        if (report) {
            throw new ReportAlreadyExistsError();
        }
        return Report.create({postId, reasonId, userId: request.session.userId}, {include: [ReportReason]});
    }

    /**
     * Creates a chat with several members
     * @param members
     * @param request
     */
    public async createChat({members}: { members?: number[] }, request: any): Promise<ChatRoom> {
        this.ensureLoggedIn(request);
        const chatMembers = [request.session.userId];
        if (members) {
            chatMembers.push(...members);
        }
        return await dataAccess.createChat(...chatMembers);
    }

    /**
     * Sends a message into a chat the user has joined
     * @param chatId
     * @param content
     * @param request
     */
    public async sendMessage({chatId, content}: { chatId: number, content: string }, request: any):
        Promise<ChatMessage> {
        this.ensureLoggedIn(request);
        const message = await dataAccess.sendChatMessage(request.session.userId, chatId, content);
        globals.internalEmitter.emit(InternalEvents.GQLCHATMESSAGE, message);
        return message;
    }

    /**
     * Sends a request to a specific user
     * @param receiver
     * @param type
     * @param request
     */
    public async sendRequest({receiver, type}: { receiver: number, type: dataAccess.RequestType }, request: any):
        Promise<Request> {
        this.ensureLoggedIn(request);
        return dataAccess.createRequest(request.session.userId, receiver, type);
    }

    /**
     * Denies a request
     * @param sender
     * @param type
     * @param request
     */
    public async denyRequest({sender, type}: { sender: number, type: dataAccess.RequestType }, request: any) {
        this.ensureLoggedIn(request);
        const user = await User.findByPk(request.session.userId);
        await user.acceptRequest(sender, type);
        return true;
    }

    /**
     * Accepts a request
     * @param sender
     * @param type
     * @param request
     */
    public async acceptRequest({sender, type}: { sender: number, type: dataAccess.RequestType }, request: any) {
        this.ensureLoggedIn(request);
        const user = await User.findByPk(request.session.userId);
        await user.acceptRequest(sender, type);
        return true;
    }

    /**
     * Removes a friend
     * @param friendId
     * @param request
     */
    public async removeFriend({friendId}: { friendId: number }, request: any): Promise<boolean> {
        this.ensureLoggedIn(request);
        const user = await User.findByPk(request.session.userId);
        return user.removeFriend(friendId);
    }

    /**
     * Creates a new group
     * @param name
     * @param members
     * @param request
     */
    public async createGroup({name, members}: { name: string, members: number[] }, request: any): Promise<Group> {
        this.ensureLoggedIn(request);
        return await dataAccess.createGroup(name, request.session.userId, members);
    }

    /**
     * Deletes a group if the user is either the creator or a site admin
     * @param groupId
     * @param request
     */
    public async deleteGroup({groupId}: { groupId: number }, request: any): Promise<boolean> {
        this.ensureLoggedIn(request);
        const user = await User.findByPk(request.session.userId);
        const group = await Group.findByPk(groupId);
        if (group) {
            if (user.isAdmin || group.creatorId === user.id) {
                await group.destroy();
                return true;
            }
        } else {
            throw new GroupNotFoundError(groupId);
        }
    }

    /**
     * Joins a group
     * @param groupId
     * @param request
     */
    public async joinGroup({groupId}: { groupId: number }, request: any): Promise<Group> {
        this.ensureLoggedIn(request);
        return dataAccess.changeGroupMembership(groupId, request.session.userId,
            dataAccess.MembershipChangeAction.ADD);
    }

    /**
     * Leaves a group
     * @param groupId
     * @param request
     */
    public async leaveGroup({groupId}: { groupId: number }, request: any): Promise<Group> {
        this.ensureLoggedIn(request);
        return dataAccess.changeGroupMembership(groupId, request.session.userId,
            dataAccess.MembershipChangeAction.REMOVE);
    }

    /**
     * Adds a user to the group admins
     * @param groupId
     * @param userId
     * @param request
     */
    public async addGroupAdmin({groupId, userId}: { groupId: number, userId: number }, request: any): Promise<Group> {
        this.ensureLoggedIn(request);
        const group = await Group.findByPk(groupId);
        const user: User = await User.findByPk(request.session.userId);
        if (group && !(await group.$has("rAdmins", user)) && (await group.creator()) !== user.id) {
            throw new NotAGroupAdminError(groupId);
        }
        return dataAccess.changeGroupMembership(groupId, userId,
            dataAccess.MembershipChangeAction.OP);
    }

    /**
     * Removes an admin from a group
     * @param groupId
     * @param userId
     * @param request
     */
    public async removeGroupAdmin({groupId, userId}: { groupId: number, userId: number },
                                  request: any): Promise<Group> {
        this.ensureLoggedIn(request);
        const group = await Group.findByPk(groupId);
        const isCreator = Number(group.creatorId) === Number(request.session.userId);
        const userIsCreator = Number(group.creatorId) === Number(userId);
        if (group && !isCreator && Number(userId) !== Number(request.session.userId)) {
            throw new NotTheGroupCreatorError(groupId);
        } else if (userIsCreator) {
            throw new GraphQLError(
                "You are not allowed to remove a creator as an admin.");
        }
        return await dataAccess.changeGroupMembership(groupId, userId,
            dataAccess.MembershipChangeAction.DEOP);
    }

    /**
     * Creates a new event for a specific group
     * @param name
     * @param dueDate
     * @param groupId
     * @param request
     */
    public async createEvent({name, dueDate, groupId}: { name: string, dueDate: string, groupId: number },
                             request: any): Promise<Event> {
        this.ensureLoggedIn(request);
        const date = new Date(Number(dueDate));
        const user: User = await User.findByPk(request.session.userId);
        const group = await Group.findByPk(groupId, {include: [{association: "rAdmins"}]});
        if (!(await group.$has("rAdmins", user))) {
            throw new NotAGroupAdminError(groupId);
        }
        const blacklisted = await dataAccess.checkBlacklisted(name);
        if (blacklisted.length > 0) {
            throw new BlacklistedError(blacklisted.map((p) => p.phrase), "event name");
        }
        return group.$create<Event>("rEvent", {name, dueDate: date});
    }

    /**
     * Deletes an event
     * @param eventId
     * @param request
     */
    public async deleteEvent({eventId}: { eventId: number }, request: any): Promise<boolean> {
        this.ensureLoggedIn(request);
        const event = await Event.findByPk(eventId, {include: [Group]});
        const user = await User.findByPk(request.session.userId);
        const group = await event.group();
        if (await group.$has("rAdmins", user)) {
            await event.destroy();
            return true;
        } else {
            throw new NotAGroupAdminError(group.id);
        }
    }

    /**
     * Joins an event
     * @param eventId
     * @param request
     */
    public async joinEvent({eventId}: { eventId: number }, request: any): Promise<Event> {
        this.ensureLoggedIn(request);
        const event = await Event.findByPk(eventId);
        const self = await User.findByPk(request.session.userId);
        await event.$add("rParticipants", self);
        return event;
    }

    /**
     * Leaves an event
     * @param eventId
     * @param request
     */
    public async leaveEvent({eventId}: { eventId: number }, request: any): Promise<Event> {
        this.ensureLoggedIn(request);
        const event = await Event.findByPk(eventId);
        const self = await User.findByPk(request.session.userId);
        await event.$remove("rParticipants", self);
        return event;
    }

    /**
     * Creates a new activity or throws an error if the activity already exists
     * @param name
     * @param description
     * @param points
     * @param request
     */
    public async createActivity({name, description, points}: { name: string, description: string, points: number },
                                request: any): Promise<Activity> {
        this.ensureLoggedIn(request.session.userId);
        const user = await User.findByPk(request.session.userId);
        if (!user.isAdmin) {
            throw new NotAnAdminError();
        }
        const nameExists = await Activity.findOne({where: {name}});
        if (!nameExists) {
            return Activity.create({name, description, points});
        } else {
            throw new GraphQLError(`An activity with the name '${name}' already exists.`);
        }
    }

    /**
     * Adds a phrase to the blaclist
     * @param phrase
     * @param languageCode
     * @param request
     */
    public async addToBlacklist({phrase, languageCode}: { phrase: string, languageCode?: string }, request: any):
        Promise<boolean> {
        this.ensureLoggedIn(request);
        const user = await User.findByPk(request.session.userId);
        if (!user.isAdmin) {
            throw new NotAnAdminError();
        }
        const phraseExists = await BlacklistedPhrase.findOne(
            {where: {phrase, language: languageCode}});
        if (!phraseExists) {
            await BlacklistedPhrase.create({phrase, language: languageCode});
            return true;
        } else {
            return false;
        }
    }

    /**
     * Removes a phrase from the blacklist
     * @param phrase
     * @param languageCode
     * @param request
     */
    public async removeFromBlacklist({phrase, languageCode}: { phrase: string, languageCode: string }, request: any):
        Promise<boolean> {
        this.ensureLoggedIn(request);
        const user = await User.findByPk(request.session.userId);
        if (!user.isAdmin) {
            throw new NotAnAdminError();
        }
        const phraseEntry = await BlacklistedPhrase.findOne(
            {where: {phrase, language: languageCode}});
        if (phraseEntry) {
            await phraseEntry.destroy();
            return true;
        } else {
            return false;
        }
    }

    /**
     * Creates a new reason for reporting posts
     * @param name
     * @param description
     * @param request
     */
    public async createReportReason({name, description}: {name: string, description: string}, request: any):
        Promise<ReportReason> {
        this.ensureLoggedIn(request);
        const user = await User.findByPk(request.session.userId);
        if (!user.isAdmin) {
            throw new NotAnAdminError();
        }
        const reasonExists = await ReportReason.findOne({where: {name}});
        if (reasonExists) {
            throw new ReportReasonNameAlreadyExistsError(name);
        }
        return ReportReason.create({name, description});
    }

    /**
     * Creates a new level
     * @param name
     * @param levelNumber
     * @param requiredPoints
     * @param request
     */
    public async createLevel({name, requiredPoints}: {name: string, requiredPoints: number}, request: any):
        Promise<Level> {
        this.ensureLoggedIn(request);
        const user = await User.findByPk(request.session.userId);
        if (!user.isAdmin) {
            throw new NotAnAdminError();
        }
        const existingLevel = await Level.findOne({where: {[sequelize.Op.or]: [{name}, {points: requiredPoints}]}});
        if (existingLevel) {
            throw new LevelAlreadyExistsError(
                existingLevel.name === name ? "name" : "points");
        }
        return Level.create({name, points: requiredPoints});
    }
}
