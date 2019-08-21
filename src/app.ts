import * as express from "express";
import * as http from "http";
import * as socketIo from "socket.io";

class App {
    public app: express.Application;
    public io: socketIo.Server;
    public server: http.Server;

    constructor() {
        this.app = express();
        this.server = new http.Server(this.app);
        this.io = socketIo(this.server);
    }
}

export default App;
