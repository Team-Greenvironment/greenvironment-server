import * as config from "config";
import * as crypto from "crypto";
import * as fsx from "fs-extra";
import * as path from "path";
import * as sharp from "sharp";
import {Readable} from "stream";
import globals from "./globals";
import {Media} from "./models";

const toArray = require("stream-to-array");

const dataDirName = "data";

/**
 * An enum representing a type of media
 */
export enum MediaType {
    IMAGE = "IMAGE",
    VIDEO = "VIDEO",
}

type ImageFit = "cover" | "contain" | "fill" | "inside" | "outside";

/**
 * A helper class for uploading and managing files
 */
export class UploadManager {

    /**
     * Returns the hash of the current time to be used as a filename.
     */
    private static getCrypticFileName() {
        const hash = crypto.createHash("md5");
        hash.update(Number(Date.now()).toString());
        return hash.digest("hex");
    }

    private readonly dataDir: string;

    constructor() {
        this.dataDir = path.join(globals.getPublicDir(), dataDirName);
    }

    /**
     * Deletes an image for a provided web path.
     * @param webPath
     */
    public async deleteWebFile(webPath: string) {
        const realPath = path.join(dataDirName, path.basename(webPath));
        if (await fsx.pathExists(realPath)) {
            await fsx.unlink(realPath);
        } else {
            globals.logger.warn(`Could not delete web image ${realPath}: Not found!`);
        }
    }

    /**
     * Converts a file to the webp format and stores it with a uuid filename.
     * The web path for the image is returned.
     * @param data
     * @param width
     * @param height
     * @param fit
     */
    public async processAndStoreImage(data: Buffer, width = 512, height = 512,
                                      fit: ImageFit = "cover"): Promise<Media> {
        const fileBasename = UploadManager.getCrypticFileName() + "." + config.get("api.imageFormat");
        await fsx.ensureDir(this.dataDir);
        const filePath = path.join(this.dataDir, fileBasename);
        let image = sharp(data)
            .resize(width, height, {
                background: "#00000000",
                fit,
            })
            .normalise();
        if (config.get<string>("api.imageFormat") === "webp") {
            image = image.webp({
                reductionEffort: 6,
                smartSubsample: true,
            });
        } else {
            image = image.png({
                adaptiveFiltering: true,
                colors: 128,
            });
        }
        await image.toFile(filePath);
        return Media.create({
            path: filePath,
            type: MediaType.IMAGE,
            url: `/${dataDirName}/${fileBasename}`,
        });
    }

    /**
     * Converts a video into a smaller format and .mp4 and returns the web path
     * @param data
     * @param extension
     */
    public async processAndStoreVideo(data: Buffer, extension: string): Promise<Media> {
        const fileBasename = UploadManager.getCrypticFileName() + extension;
        await fsx.ensureDir(this.dataDir);
        const filePath = path.join(this.dataDir, fileBasename);
        await fsx.writeFile(filePath, data);
        return Media.create({
            path: filePath,
            type: MediaType.VIDEO,
            url: `/${dataDirName}/${fileBasename}`,
        });
    }

    /**
     * Convers a readable to a buffer
     * @param stream
     */
    public async streamToBuffer(stream: Readable) {
        const parts = await toArray(stream);
        const buffers = parts
            .map((part: any) => Buffer.isBuffer(part) ? part : Buffer.from(part));
        return Buffer.concat(buffers);
    }
}
