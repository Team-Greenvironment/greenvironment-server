import * as express from "express";
import * as http from "http";
import * as path from "path";
import * as socketIo from "socket.io";
import dataaccess from "./lib/dataaccess";
import globals from "./lib/globals";
import routes from "./routes";

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
        this.app.set("views", path.join(__dirname, "views"));
        this.app.set("view engine", "pug");
        this.app.use(routes.router);
    }

    /**
     * Starts the web server.
     */
    public start() {
        if (globals.config.server.port) {
            globals.logger.info(`Starting server...`);
            this.app.listen(globals.config.server.port);
            globals.logger.info(`Server running on port ${globals.config.server.port}`);
        } else {
            globals.logger.error("No port specified in the config." +
                "Please configure a port in the config.yaml.");
        }
    }
}

export default App;
