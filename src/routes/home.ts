import {Router} from "express";
import {GraphQLError} from "graphql";
import * as status from "http-status";
import {Server} from "socket.io";
import dataaccess from "../lib/dataaccess";
import {Post} from "../lib/dataaccess/Post";
import {Profile} from "../lib/dataaccess/Profile";
import Route from "../lib/Route";

/**
 * Class for the home route.
 */
class HomeRoute extends Route {
    /**
     * Constructor, creates new router.
     */
    constructor() {
        super();
        this.router = Router();
    }

    /**
     * Asynchronous init for socket.io.
     * @param io - the io instance
     */
    public async init(io: Server) {
        this.io = io;
    }

    /**
     * Destroys the instance by dereferencing the router and resolver.
     */
    public async destroy(): Promise<void> {
        this.router = null;
        this.resolver = null;
    }

    /**
     * Returns the resolvers for the graphql api.
     * @param req - the request object
     * @param res - the response object
     */
    public resolver(req: any, res: any): any {
        return {
            getSelf() {
                if (req.session.userId) {
                    return new Profile(req.session.userId);
                } else {
                    res.status(status.UNAUTHORIZED);
                    return new GraphQLError("Not logged in");
                }
            },
            acceptCookies() {
                req.session.cookiesAccepted = true;
                return true;
            },
            async login(args: {email: string, passwordHash: string}) {
                if (args.email && args.passwordHash) {
                    const user = await dataaccess.getUserByLogin(args.email, args.passwordHash);
                    if (user && user.id) {
                        req.session.userId = user.id;
                        return user;
                    } else {
                        res.status(status.BAD_REQUEST);
                        return new GraphQLError("Invalid login data.");
                    }
                } else {
                    res.status(status.BAD_REQUEST);
                    return new GraphQLError("No email or password given.");
                }
            },
            logout() {
                if (req.session.user) {
                    delete req.session.user;
                    return true;
                } else {
                    res.status(status.UNAUTHORIZED);
                    return new GraphQLError("User is not logged in.");
                }
            },
            async register(args: {username: string, email: string, passwordHash: string}) {
                if (args.username && args.email && args.passwordHash) {
                    const user = await dataaccess.registerUser(args.username, args.email, args.passwordHash);
                    if (user) {
                        req.session.userId = user.id;
                        return user;
                    } else {
                        res.status(status.INTERNAL_SERVER_ERROR);
                        return new GraphQLError("Failed to create account.");
                    }
                } else {
                    res.status(status.BAD_REQUEST);
                    return new GraphQLError("No username, email or password given.");
                }
            },
            async vote(args: {postId: number, type: dataaccess.VoteType}) {
                if (args.postId && args.type) {
                    if (req.session.userId) {
                        return await (new Post(args.postId)).vote(req.session.userId, args.type);
                    } else {
                        res.status(status.UNAUTHORIZED);
                        return new GraphQLError("Not logged in.");
                    }
                } else {
                    res.status(status.BAD_REQUEST);
                    return new GraphQLError("No postId or type given.");
                }
            },
            async createPost(args: {content: string}) {
                if (args.content) {
                    if (req.session.userId) {
                        return await dataaccess.createPost(args.content, req.session.userId);
                    } else {
                        res.status(status.UNAUTHORIZED);
                        return new GraphQLError("Not logged in.");
                    }
                } else {
                    res.status(status.BAD_REQUEST);
                    return new GraphQLError("Can't create empty post.");
                }
            },
            async deletePost(args: {postId: number}) {
                if (args.postId) {
                    const post = new Post(args.postId);
                    if ((await post.author()).id === req.session.userId) {
                        return await dataaccess.deletePost(post.id);
                    } else {
                        res.status(status.FORBIDDEN);
                        return new GraphQLError("User is not author of the post.");
                    }
                } else {
                    return new GraphQLError("No postId given.");
                }
            },
        };
    }
}

export default HomeRoute;
