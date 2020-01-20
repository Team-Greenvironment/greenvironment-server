import {GraphQLError} from "graphql";
import {Op} from "sequelize";
import dataaccess from "../lib/dataAccess";
import {ChatNotFoundError} from "../lib/errors/ChatNotFoundError";
import {PostNotFoundGqlError} from "../lib/errors/graphqlErrors";
import {GroupNotFoundError} from "../lib/errors/GroupNotFoundError";
import {InvalidLoginError} from "../lib/errors/InvalidLoginError";
import {RequestNotFoundError} from "../lib/errors/RequestNotFoundError";
import {UserNotFoundError} from "../lib/errors/UserNotFoundError";
import {
    Activity,
    BlacklistedPhrase,
    ChatRoom,
    Event,
    Group,
    Post,
    Request,
    User,
} from "../lib/models";
import {BaseResolver} from "./BaseResolver";
import {BlacklistedResult} from "./BlacklistedResult";
import {SearchResult} from "./SearchResult";
import {Token} from "./Token";

/**
 * A class that provides functions to resolve queries
 */
export class QueryResolver extends BaseResolver {

    /**
     * Gets a user by id or handle
     * @param userId
     * @param handle
     */
    public async getUser({userId, handle}: {userId?: number, handle?: string}): Promise<User> {
        let user: User;
        if (userId) {
            user = await User.findByPk(userId);
        } else if (handle) {
            user = await User.findOne({where: {handle}});
        } else {
            throw new GraphQLError("No handle or userId provided");
        }
        if (user) {
            return user;
        } else {
            throw new UserNotFoundError(userId ?? handle);
        }
    }

    /**
     * Returns the instance of the currently logged in user
     * @param args
     * @param request
     */
    public async getSelf(args: null, request: any): Promise<User>  {
        this.ensureLoggedIn(request);
        return User.findByPk(request.session.userId);
    }

    /**
     * Returns a post for a given post id.
     * @param postId
     */
    public async getPost({postId}: {postId: number}): Promise<Post> {
        const post = await Post.findByPk(postId);
        if (post) {
            return post;
        } else {
            throw new PostNotFoundGqlError(postId);
        }
    }

    /**
     * Returns a chat for a given chat id
     * @param chatId
     */
    public async getChat({chatId}: {chatId: number}): Promise<ChatRoom> {
        const chat = await ChatRoom.findByPk(chatId);
        if (chat) {
            return chat;
        } else {
            throw new ChatNotFoundError(chatId);
        }
    }

    /**
     * Returns a group for a given group id.
     * @param groupId
     */
    public async getGroup({groupId}: {groupId: number}): Promise<Group> {
        const group = await Group.findByPk(groupId);
        if (group) {
            return group;
        } else {
            throw new GroupNotFoundError(groupId);
        }
    }

    /**
     * Returns the request for a given id.
     * @param requestId
     */
    public async getRequest({requestId}: {requestId: number}): Promise<Request> {
        const request = await Request.findByPk(requestId);
        if (request) {
            return request;
        } else {
            throw new RequestNotFoundError(requestId);
        }
    }

    /**
     * Searches for posts, groups, users, events and returns a search result.
     * @param query
     * @param first
     * @param offset
     */
    public async search({query, first, offset}: {query: number, first: number, offset: number}): Promise<SearchResult> {
        const limit = first;
        const users = await User.findAll({
            limit,
            offset,
            where: {
                [Op.or]: [
                    {handle: {[Op.iRegexp]: query}},
                    {username: {[Op.iRegexp]: query}},
                ],
            },
        });
        const groups = await Group.findAll({
            limit,
            offset,
            where: {name: {[Op.iRegexp]: query}},
        });
        const posts = await Post.findAll({
            limit,
            offset,
            where: {content: {[Op.iRegexp]: query}},
        });
        const events = await Event.findAll({
            limit,
            offset,
            where: {name: {[Op.iRegexp]: query}},
        });
        return new SearchResult(users, groups, posts, events);
    }

    /**
     * Returns the posts with a specific sorting
     * @param first
     * @param offset
     * @param sort
     */
    public async getPosts({first, offset, sort}: {first: number, offset: number, sort: dataaccess.SortType}):
        Promise<Post[]> {
        return await dataaccess.getPosts(first, offset, sort);
    }

    /**
     * Returns all activities
     */
    public async getActivities(): Promise<Activity[]> {
        return  Activity.findAll();
    }

    /**
     * Returns the token for a user by login
     * @param email
     * @param passwordHash
     */
    public async getToken({email, passwordHash}: {email: string, passwordHash: string}): Promise<Token> {
        const user = await dataaccess.getUserByLogin(email, passwordHash);
        return new Token(await user.token(), Number(user.authExpire).toString());
    }

    /**
     * Returns if a input phrase contains blacklisted phrases and which one
     * @param phrase
     */
    public async blacklisted({phrase}: {phrase: string}): Promise<BlacklistedResult> {
        const phrases = await dataaccess.checkBlacklisted(phrase);
        return new BlacklistedResult(phrases.length > 0, phrases
            .map((p) => p.phrase));
    }

    /**
     * Returns all blacklisted phrases with pagination
     * @param first
     * @param offset
     */
    public async getBlacklistedPhrases({first, offset}: {first: number, offset: number}): Promise<string[]> {
        return (await BlacklistedPhrase.findAll({limit: first, offset}))
            .map((p) => p.phrase);
    }
}
