/**
 * @author Trivernis
 * @remarks
 *
 * Taken from {@link https://github.com/Trivernis/whooshy}
 */

import {Router} from "express";
import {Server} from "socket.io";

import HomeRoute from "./home";

const homeRoute = new HomeRoute();

/**
 * Namespace to manage the routes of the server.
 * Allows easier assignments of graphql endpoints, socket.io connections and routers when
 * used with {@link Route}.
 */
namespace routes {
    export const router = Router();

    router.use("/", homeRoute.router);

    /**
     * Assigns the io listeners or namespaces to the routes
     * @param io
     */
    export const ioListeners = async (io: Server) => {
        await homeRoute.init(io);
    };
}

export default routes;
