import {EventEmitter} from "events";
import * as fsx from "fs-extra";
import * as yaml from "js-yaml";
import * as path from "path";
import * as winston from "winston";

require("winston-daily-rotate-file");

const configPath = "config.yaml";
const defaultConfig = path.join(__dirname, "/../default-config.yaml");

// ensure that the config exists by copying the default config.
if (!(fsx.pathExistsSync(configPath))) {
    fsx.copySync(defaultConfig, configPath);
} else {
    const conf = yaml.safeLoad(fsx.readFileSync(configPath, "utf-8"));
    const defConf = yaml.safeLoad(fsx.readFileSync(defaultConfig, "utf-8"));
    fsx.writeFileSync(configPath, yaml.safeDump(Object.assign(defConf, conf)));
}

/**
 * Defines global variables to be used.
 */
namespace globals {
    export const config: IConfig = yaml.safeLoad(fsx.readFileSync("config.yaml", "utf-8"));
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
                level: config.logging?.level ?? "info",
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
                level: config.logging?.level ?? "info",
                maxFiles: "7d",
                zippedArchive: true,
            }),
        ],
    });
    export const internalEmitter: EventEmitter = new EventEmitter();
}

export default globals;
