/**
 * An interface for the configuration file
 */
interface IConfig {
    /**
     * Database connection info
     */
    database: {
        /**
         * A connection uri for the database. <type>://<user>:<password>@<ip/domain>/<database>
         */
        connectionUri: string;
    };
    /**
     * Configuration for the http server
     */
    server?: {
        /**
         * The port to listen on
         */
        port?: number;
        /**
         * If cross origin requests should be enabled
         */
        cors?: false;
    };
    /**
     * The session configuration
     */
    session: {
        /**
         * A secure secret to be used for sessions
         */
        secret: string;
        /**
         * The maximum cookie age before the session gets deleted
         */
        cookieMaxAge: number;
    };
    /**
     * Configuration for markdown parsing
     */
    markdown?: {
        /**
         * The plugins to use for parsing
         */
        plugins: string[];
    };
    /**
     * Logging configuration
     */
    logging?: {
        /**
         * The loglevel that is used for the console and logfiles
         */
        level?: ("silly" | "debug" | "verbose" | "info" | "warn" | "error");
    };
    /**
     * The frontend configuration
     */
    frontend?: {
        /**
         * Points to the index.html which is loaded as a fallback for angular to work
         */
        angularIndex?: string;

        /**
         * The path of the public folder
         */
        publicPath?: string;
    };
}
