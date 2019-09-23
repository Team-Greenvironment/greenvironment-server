import {Router} from "express";
import {Server} from "socket.io";
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
    public async resolver(req: any, res: any): Promise<object> {
        return {
            // TODO: Define grapql resolvers
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
