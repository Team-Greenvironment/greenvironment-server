import * as compression from "compression";
import * as config from "config";
import * as cookieParser from "cookie-parser";
import * as cors from "cors";
import {Request, Response} from "express";
import * as express from "express";
import * as graphqlHTTP from "express-graphql";
import * as session from "express-session";
import sharedsession = require("express-socket.io-session");
import * as fsx from "fs-extra";
import {buildSchema} from "graphql";
import {importSchema} from "graphql-import";
import queryComplexity, {simpleEstimator, directiveEstimator} from "graphql-query-complexity";
import {IncomingMessage, ServerResponse} from "http";
import * as http from "http";
import * as httpStatus from "http-status";
import * as path from "path";
import {RedisClient} from "redis";
import * as redis from "redis";
import {Sequelize} from "sequelize-typescript";
import * as socketIo from "socket.io";
import * as socketIoRedis from "socket.io-redis";
import {query} from "winston";
import {resolver} from "./graphql/resolvers";
import dataaccess from "./lib/dataAccess";
import globals from "./lib/globals";
import HomeRoute from "./routes/HomeRoute";
import {UploadRoute} from "./routes/UploadRoute";

const SequelizeStore = require("connect-session-sequelize")(session.Store);
const createLimiter: (...args: any) => any = require("express-limiter");
const logger = globals.logger;

/**
 * The main entry class for each cluster worker
 */
class App {

    /**
     * The corresponding express application
     */
    public app: express.Application;

    /**
     * An instance of the socket.io server for websockets
     */
    public io: socketIo.Server;

    /**
     * The instance of the redis client
     */
    public redisClient: RedisClient;

    /**
     * The limiter for api requests
     */
    public limiter: any;

    /**
     * An instance of the http server where the site is served
     */
    public server: http.Server;

    /**
     * The path to the public folder that is served statically
     */
    public readonly publicPath: string;

    /**
     * The id of the worker
     */
    public readonly id?: number;

    /**
     * The instance of sequelize for ORM
     */
    public readonly sequelize: Sequelize;

    constructor(id?: number) {
        this.id = id;
        this.app = express();
        this.redisClient = redis.createClient(null, null, {url: config.get("redis.connectionUri")});
        this.limiter = createLimiter(this.app, this.redisClient);
        this.server = new http.Server(this.app);
        this.io = socketIo(this.server);
        this.sequelize = new Sequelize(config.get("database.connectionUri"));
        this.publicPath = config.get("frontend.publicPath");
        if (!path.isAbsolute(this.publicPath)) {
            this.publicPath = path.normalize(path.join(__dirname, this.publicPath));
        }
    }

    /**
     * initializes everything that needs to be initialized asynchronous.
     */
    public async init(): Promise<void> {
        await dataaccess.init(this.sequelize);

        const appSession = session({
            cookie: {
                maxAge: Number(config.get("session.cookieMaxAge")),
                // @ts-ignore
                secure: "auto",
            },
            resave: false,
            saveUninitialized: false,
            secret: config.get("session.secret"),
            store: new SequelizeStore({db: this.sequelize}),
        });

        await this.sequelize.sync({ logging: (msg) => logger.silly(msg)});
        this.sequelize.options.logging = (msg) => logger.silly(msg);
        logger.info("Setting up socket.io");
        try {
            this.io.adapter(socketIoRedis(config.get("redis.connectionUri")));
        } catch (err) {
            logger.error(err.message);
            logger.debug(err.stack);
        }
        this.io.use(sharedsession(appSession, {autoSave: true}));

        logger.info("Configuring express app.");
        this.server.setTimeout(config.get("server.timeout"));
        this.app.set("views", path.join(__dirname, "views"));
        this.app.set("view engine", "pug");
        this.app.set("trust proxy", 1);

        this.app.use(compression());
        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: false}));
        this.app.use(express.static(this.publicPath));
        this.app.use(cookieParser());
        this.app.use(appSession);
        // enable cross origin requests if enabled in the config
        if (config.get("server.cors")) {
            this.app.use(cors());
        }
        // handle authentication via bearer in the Authorization header
        this.app.use(async (req, res, next) => {
            try {
                if (!req.session.userId && req.headers.authorization) {
                    const bearer = req.headers.authorization.split("Bearer ")[1];
                    if (bearer) {
                        const user = await dataaccess.getUserByToken(bearer);
                        // @ts-ignore
                        req.session.userId = user.id;
                    }
                }
            } catch (err) {
                logger.error(err.message);
                logger.debug(err.stack);
            }
            next();
        });
        this.app.use((req, res, next) => {
            logger.verbose(`${req.method} ${req.url}`);
            next();
        });

        // add custom routes

        const uploadRoute = new UploadRoute(this.publicPath);
        const homeRoute = new HomeRoute();
        await uploadRoute.init();
        await homeRoute.init(this.io);

        this.app.use("/home", homeRoute.router);
        this.limiter({
            expire: config.get("api.rateLimit.upload.expire"),
            lookup: ["connection.remoteAddress"],
            method: "all",
            onRateLimited: (req: IncomingMessage, res: any) => {
                res.status(httpStatus.TOO_MANY_REQUESTS);
                res.json({error: "Rate Limit Exceeded"});
            },
            path: "/upload",
            total: config.get("api.rateLimit.upload.total"),
        });
        this.app.use("/upload", uploadRoute.router);


        // listen for graphql requests
        this.limiter({
            expire: config.get("api.rateLimit.graphql.expire"),
            lookup: ["connection.remoteAddress"],
            method: "all",
            onRateLimited: (req: IncomingMessage, res: any) => {
                res.status(httpStatus.TOO_MANY_REQUESTS);
                res.json({errors: [{message: "Rate Limit Exceeded"}]});
            },
            path: "/graphql",
            total: config.get("api.rateLimit.graphql.total"),
        });

        // @ts-ignore
        this.app.use("/graphql",  graphqlHTTP(async (request, response, {variables}) => {
            return {
                // @ts-ignore all
                context: {session: request.session},
                graphiql: config.get("api.graphiql"),
                rootValue: resolver(request, response),
                schema: buildSchema(importSchema(path.join(__dirname, "./graphql/schema.graphql"))),
                validationRules: [
                    queryComplexity({
                        estimators: [
                            directiveEstimator(),
                            simpleEstimator(),
                        ],
                        maximumComplexity: config.get("api.maxQueryComplexity"),
                        onComplete: (complexity: number) => {
                            logger.debug(`QueryComplexity: ${complexity}`);
                        },
                        variables,
                    }),
                ],
            };
        }));
        // allow access to cluster information
        this.app.use("/cluster-info", (req: Request, res: Response) => {
            res.json({
                id: this.id,
            });
        });
        // redirect all request to the angular file
        this.app.use((req: any, res: Response) => {
            if (config.get("frontend.angularIndex")) {
                const angularIndex = path.join(this.publicPath, config.get("frontend.angularIndex"));
                if (fsx.existsSync(path.join(angularIndex))) {
                    res.sendFile(angularIndex);
                } else {
                    res.status(httpStatus.NOT_FOUND);
                    res.render("errors/404.pug", {url: req.url});
                }
            } else {
                res.status(httpStatus.NOT_FOUND);
                res.render("errors/404.pug", {url: req.url});
            }
        });
        // show an error page for internal errors
        this.app.use((err, req: Request, res: Response) => {
            res.status(httpStatus.INTERNAL_SERVER_ERROR);
            res.render("errors/500.pug");
        });
        logger.info("Server configured.");
    }

    /**
     * Starts the web server.
     */
    public start(): void {
        if (config.has("server.port")) {
            logger.info(`Starting server...`);
            this.app.listen(config.get("server.port"));
            logger.info(`Server running on port ${config.get("server.port")}`);
        } else {
            logger.error("No port specified in the config." +
                "Please configure a port in the config.yaml.");
        }
    }
}

export default App;
