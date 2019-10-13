/**
 * @author Trivernis
 * @remarks
 *
 * Partly taken from {@link https://github.com/Trivernis/whooshy}
 */

import {EventEmitter} from "events";
import * as fsx from "fs-extra";
import * as yaml from "js-yaml";
import * as winston from "winston";

const configPath = "config.yaml";
const defaultConfig = __dirname + "/../default-config.yaml";

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
    export const config = yaml.safeLoad(fsx.readFileSync("config.yaml", "utf-8"));
    export const logger = winston.createLogger({
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.colorize(),
                    winston.format.printf(({level, message, timestamp}) => {
                        return `${timestamp} ${level}: ${message}`;
                    }),
                ),
                level: config.logging.level,
            }),
        ],
    });
    export const internalEmitter = new EventEmitter();
}

export default globals;
