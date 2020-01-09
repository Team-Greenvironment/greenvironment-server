import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import * as cors from "cors";
import {Request, Response} from "express";
import * as express from "express";
import {UploadedFile} from "express-fileupload";
import * as fileUpload from "express-fileupload";
import * as graphqlHTTP from "express-graphql";
import * as session from "express-session";
import sharedsession = require("express-socket.io-session");
import * as fsx from "fs-extra";
import {buildSchema} from "graphql";
import {importSchema} from "graphql-import";
import * as http from "http";
import * as httpStatus from "http-status";
import * as path from "path";
import {Sequelize} from "sequelize-typescript";
import * as sharp from "sharp";
import * as socketIo from "socket.io";
import * as socketIoRedis from "socket.io-redis";
import {resolver} from "./graphql/resolvers";
import dataaccess from "./lib/dataAccess";
import globals from "./lib/globals";
import routes from "./routes";

const SequelizeStore = require("connect-session-sequelize")(session.Store);
const logger = globals.logger;

class App {
    public app: express.Application;
    public io: socketIo.Server;
    public server: http.Server;
    public readonly publicPath: string;
    public readonly id?: number;
    public readonly sequelize: Sequelize;

    constructor(id?: number) {
        this.id = id;
        this.app = express();
        this.server = new http.Server(this.app);
        this.io = socketIo(this.server);
        this.sequelize = new Sequelize(globals.config.database.connectionUri);
        this.publicPath = globals.config.frontend.publicPath;
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
                maxAge: Number(globals.config.session.cookieMaxAge) || 604800000,
                // @ts-ignore
                secure: "auto",
            },
            resave: false,
            saveUninitialized: false,
            secret: globals.config.session.secret,
            store: new SequelizeStore({db: this.sequelize}),
        });

        const force = fsx.existsSync("sqz-force");
        logger.info(`Syncinc database. Sequelize Table force: ${force}.`);
        await this.sequelize.sync({force, logging: (msg) => logger.silly(msg)});
        this.sequelize.options.logging = (msg) => logger.silly(msg);
        logger.info("Setting up socket.io");
        await routes.ioListeners(this.io);
        try {
            this.io.adapter(socketIoRedis());
        } catch (err) {
            logger.error(err.message);
            logger.debug(err.stack);
        }
        this.io.use(sharedsession(appSession, {autoSave: true}));

        logger.info("Configuring express app.");
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
        if (globals.config.server?.cors) {
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
        this.app.use(routes.router);
        // listen for graphql requests
        this.app.use("/graphql",  graphqlHTTP((request, response) => {
            return {
                // @ts-ignore all
                context: {session: request.session},
                graphiql: true,
                rootValue: resolver(request, response),
                schema: buildSchema(importSchema(path.join(__dirname, "./graphql/schema.graphql"))),
            };
        }));
        this.app.use("/upload", fileUpload());
        this.app.use("/upload", async (req, res) => {
            const profilePic = req.files.profilePicture as UploadedFile;
            let success = false;
            let fileName;
            if (profilePic && req.session.userId) {
                const dir = path.join(this.publicPath, "data/profilePictures");
                await fsx.ensureDir(dir);
                await sharp(profilePic.data)
                    .resize(512, 512)
                    .normalise()
                    .png()
                    .toFile(path.join(dir, req.session.userId + ".png"));
                success = true;
                fileName = `/data/profilePictures/${req.session.userId}.png`;
            } else {
                res.status(400);
            }
            res.json({
                fileName,
                success,
            });
        });
        // allow access to cluster information
        this.app.use("/cluster-info", (req: Request, res: Response) => {
            res.json({
                id: this.id,
            });
        });
        // redirect all request to the angular file
        this.app.use((req: any, res: Response) => {
            if (globals.config.frontend.angularIndex) {
                const angularIndex = path.join(this.publicPath, globals.config.frontend.angularIndex);
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
        if (globals.config.server?.port) {
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
