import * as config from "config";
import {EventEmitter} from "events";
import * as winston from "winston";

require("winston-daily-rotate-file");

/**
 * Defines global variables to be used.
 */
namespace globals {
    // @ts-ignore
    export const logger: winston.Logger = winston.createLogger({
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.colorize(),
                    winston.format.printf(({level, message, timestamp}) => {
                        return `${timestamp} ${level}: ${message}`;
                    }),
                ),
                level: config.get("logging.level"),
            }),
            // @ts-ignore
            new (winston.transports.DailyRotateFile)({
                dirname: "logs",
                filename: "gv-%DATE%.log",
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.printf(({level, message, timestamp}) => {
                        return `${timestamp} ${level}: ${message}`;
                    }),
                ),
                json: false,
                level: config.get("logging.level"),
                maxFiles: "7d",
                zippedArchive: true,
            }),
        ],
    });
    export const internalEmitter: EventEmitter = new EventEmitter();
}

export default globals;
