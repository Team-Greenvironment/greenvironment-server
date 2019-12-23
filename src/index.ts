// tslint:disable:no-console
import * as cluster from "cluster";
import App from "./app";
const numCPUs = require("os").cpus().length;

interface IResourceUsage {
    mem: {rss: number, heapTotal: number, heapUsed: number, external: number};
    cpu: {user: number, system: number};
}

interface IClusterData {
    reqCount: number;
    workerCount: () => number;
    workerRes: {[key: string]: IResourceUsage};
}

if (cluster.isMaster) {
    console.log(`[CLUSTER-M] Master ${process.pid} is running`);

    cluster.settings.silent = true;

    cluster.on("exit", (worker, code) => {
        console.error(`[CLUSTER-M] Worker ${worker.id} died! (code: ${code})`);
        console.log("[CLUSTER-M] Starting new worker");
        cluster.fork();
    });
    cluster.on("online", (worker) => {
        worker.process.stdout.on("data", (data) => {
            process.stdout.write(`[CLUSTER-${worker.id}] ${data}`);
        });
    });

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
} else {

    /**
     * async main function wrapper.
     */
    (async () => {
        try {
            const app = new App(cluster.worker.id);
            await app.init();
            app.start();
        } catch (err) {
            console.error(err.message);
            console.error(err.stack);
            process.exit(1);
        }
    })();

    console.log(`[CLUSTER] Worker ${process.pid} started`);
}
