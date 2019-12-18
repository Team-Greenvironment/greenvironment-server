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
    const clusterData: IClusterData = {
        reqCount: 0,
        workerCount: () => Object.keys(cluster.workers).length,
        // @ts-ignore
        workerRes: {},
    };

    setInterval(() => {
            clusterData.workerRes.M = {
                cpu: process.cpuUsage(),
                mem: process.memoryUsage(),
            };
    }, 1000);

    const log = (msg: string) => {
        process.stdout.write(" ".padEnd(100) + "\r");
        process.stdout.write(msg);
        process.stdout.write(
            `W: ${clusterData.workerCount()},R: ${clusterData.reqCount},M: ${(() => {
                let usageString = "";
                for (const [key, value] of Object.entries(clusterData.workerRes)) {
                    usageString += `${
                        Math.round((value as IResourceUsage).mem.heapUsed / 100000) / 10}MB,`.padEnd(8);
                }
                return usageString;
            })()}`.padEnd(99) + "\r");
    };
    cluster.settings.silent = true;

    cluster.on("exit", (worker, code, signal) => {
        log(`[CLUSTER-M] Worker ${worker.process.pid} died!\n`);
        delete clusterData.workerRes[worker.id];
        log("[CLUSTER-M] Starting new worker\n");
        cluster.fork();
    });
    cluster.on("online", (worker) => {
        worker.process.stdout.on("data", (data) => {
            log(`[CLUSTER-${worker.id}] ${data}`);
        });
    });
    cluster.on("message", (worker, message) => {
        switch (message.cmd) {
            case "notifyRequest":
                clusterData.reqCount++;
                log("");
                break;
            case "notifyResources":
                // @ts-ignore
                clusterData.workerRes[worker.id] = message.data;
                log("");
                break;
            default:
                break;
        }
    });

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
} else {

    /**
     * async main function wrapper.
     */
    (async () => {
        setInterval(() => {
            process.send({cmd: "notifyResources", data: {
                cpu: process.cpuUsage(),
                mem: process.memoryUsage(),
            }});
        }, 1000);
        const app = new App(cluster.worker.id);
        await app.init();
        app.start();
    })();

    console.log(`[CLUSTER] Worker ${process.pid} started`);
}
