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
     * Asnyc function to create a graphql resolver that takes the request and response
     * of express.js as arguments.
     * @param request
     * @param response
     */
    export async function resolvers(request: any, response: any): Promise<object> {
        return homeRoute.resolver(request, response);
    }

    /**
     * Assigns the io listeners or namespaces to the routes
     * @param io
     */
    export const ioListeners = async (io: Server) => {
        await homeRoute.init(io);
    };
}

export default routes;
