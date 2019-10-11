import * as compression from "compression";
import connectPgSimple = require("connect-pg-simple");
import * as cookieParser from "cookie-parser";
import * as cors from "cors";
import * as express from "express";
import * as graphqlHTTP from "express-graphql";
import * as session from "express-session";
import sharedsession = require("express-socket.io-session");
import {buildSchema} from "graphql";
import {importSchema} from "graphql-import";
import * as http from "http";
import * as path from "path";
import * as socketIo from "socket.io";
import {resolver} from "./graphql/resolvers";
import dataaccess, {queryHelper} from "./lib/dataaccess";
import globals from "./lib/globals";
import routes from "./routes";

const logger = globals.logger;

const PgSession = connectPgSimple(session);

class App {
    public app: express.Application;
    public io: socketIo.Server;
    public server: http.Server;

    constructor() {
        this.app = express();
        this.server = new http.Server(this.app);
        this.io = socketIo(this.server);
    }

    /**
     * initializes everything that needs to be initialized asynchronous.
     */
    public async init() {
        await dataaccess.init();
        await routes.ioListeners(this.io);

        const appSession = session({
            cookie: {
                maxAge: Number(globals.config.session.cookieMaxAge) || 604800000,
                secure: "auto",
            },
            resave: false,
            saveUninitialized: false,
            secret: globals.config.session.secret,
            store: new PgSession({
                pool: dataaccess.pool,
                tableName: "user_sessions",
            }),
        });

        this.io.use(sharedsession(appSession, {autoSave: true}));

        this.app.set("views", path.join(__dirname, "views"));
        this.app.set("view engine", "pug");
        this.app.set("trust proxy", 1);

        this.app.use(compression());
        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: false}));
        this.app.use(express.static(path.join(__dirname, "public")));
        this.app.use(cookieParser());
        this.app.use(appSession);
        if (globals.config.server.cors) {
            this.app.use(cors());
        }
        this.app.use((req, res, next) => {
            logger.verbose(`${req.method} ${req.url}`);
            next();
        });
        this.app.use(routes.router);
        this.app.use("/graphql",  graphqlHTTP((request, response) => {
            return {
                // @ts-ignore all
                context: {session: request.session},
                graphiql: true,
                rootValue: resolver(request, response),
                schema: buildSchema(importSchema(path.join(__dirname, "./graphql/schema.graphql"))),
            };
        }));
    }

    /**
     * Starts the web server.
     */
    public start() {
        if (globals.config.server.port) {
            logger.info(`Starting server...`);
            this.app.listen(globals.config.server.port);
            logger.info(`Server running on port ${globals.config.server.port}`);
        } else {
            logger.error("No port specified in the config." +
                "Please configure a port in the config.yaml.");
        }
    }
}

export default App;
