import {Router} from "express";
import {GraphQLError} from "graphql";
import * as status from "http-status";
import {constants} from "http2";
import {Server} from "socket.io";
import dataaccess from "../lib/dataaccess";
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
        this.configure();
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
            acceptCookies() {
                req.session.cookiesAccepted = true;
                return true;
            },
            async login(args: any) {
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
        };
    }

    /**
     * Configures the route.
     */
    private configure() {
        this.router.get("/", (req, res) => {
            res.render("home");
        });
        this.router.get("/login", (req, res) => {
            res.render("login");
        });
        this.router.get("/register", (req, res) => {
            res.render("register");
        });
    }
}

export default HomeRoute;
