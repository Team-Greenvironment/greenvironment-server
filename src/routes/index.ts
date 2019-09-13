import {Router} from "express";
import {Server} from "socket.io";

import homeRouter from "./home";

namespace routes {
    export const router = Router();

    router.use("/", homeRouter);

    export const resolvers = async (request: any, response: any): Promise<object> => {
        return {
        };
    };

    // tslint:disable-next-line:no-empty
    export const ioListeners = (io: Server) => {

    };
}

export default routes;
