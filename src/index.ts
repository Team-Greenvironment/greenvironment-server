import * as fsx from "fs-extra";
import App from "./app";

const configPath = "config.yaml";
const defaultConfig = __dirname + "/default-config.yaml";

/**
 * async main function wrapper.
 */
(async () => {
    if (!(await fsx.pathExists(configPath))) {
        await fsx.copy(defaultConfig, configPath);
    }
    const app = new App();
})();

