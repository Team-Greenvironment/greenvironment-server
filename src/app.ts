import * as express from "express";
import * as http from "http";
import * as socketIo from "socket.io";
import {DAO} from "./lib/DAO";
import globals from "./lib/globals";
class App {
    public app: express.Application;
    public io: socketIo.Server;
    public server: http.Server;
    public dao: DAO;

    constructor() {
        this.app = express();
        this.server = new http.Server(this.app);
        this.io = socketIo(this.server);
        this.dao = new DAO();
    }

    /**
     * initializes everything that needs to be initialized asynchronous.
     */
    public async init() {
        await this.dao.init();
        this.app.all("/", (req, res) => {
            res.send("WIP!");
        });
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
