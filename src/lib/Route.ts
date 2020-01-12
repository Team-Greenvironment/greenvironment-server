import {Router} from "express";
import {Namespace, Server} from "socket.io";

/**
 * Abstract Route class to be implemented by each route.
 * This class contains the socket-io Server, router and resolver
 * for each route.
 */
abstract class Route {

    /**
     * The express router belonging to the route
     */
    public router?: Router;

    /**
     * An instance of socket io for the route
     */
    protected io?: Server;

    /**
     * The namespace of the websocket for the route
     */
    protected ions?: Namespace;

    /**
     * An asynchronous init function
     * @param params
     */
    public abstract async init(...params: any): Promise<any>;

    /**
     * An asynchronous destroy function
     * @param params
     */
    public abstract async destroy(...params: any): Promise<any>;
}

export default Route;
