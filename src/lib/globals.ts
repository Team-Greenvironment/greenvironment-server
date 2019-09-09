import * as fsx from "fs-extra";
import * as yaml from "js-yaml";
import * as winston from "winston";

/**
 * Defines global variables to be used.
 */
namespace globals {
    export const config = yaml.safeLoad(fsx.readFileSync("config.yaml", "utf-8"));
    export const logger = winston.createLogger({
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.colorize(),
                    winston.format.printf(({ level, message, label, timestamp }) => {
                        return `${timestamp} ${level}: ${message}`;
                    }),
                ),
            }),
        ],
    });
}

export default globals;
