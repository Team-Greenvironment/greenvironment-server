// tslint:disable:no-console
import * as cluster from "cluster";
import App from "./app";
const numCPUs = require("os").cpus().length;

if (cluster.isMaster) {
    console.log(`[CLUSTER] Master ${process.pid} is running`);
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    cluster.on("exit", (worker, code, signal) => {
        console.log(`[CLUSTER] Worker ${worker.process.pid} died!`);
    });
} else {

    /**
     * async main function wrapper.
     */
    (async () => {
        const app = new App(process.pid);
        await app.init();
        app.start();
    })();

    console.log(`[CLUSTER] Worker ${process.pid} started`);
}
