import * as bodyParser from "body-parser";
import * as config from "config";
import * as crypto from "crypto";
import {Router} from "express";
import * as fileUpload from "express-fileupload";
import {UploadedFile} from "express-fileupload";
import * as ffmpeg from "fluent-ffmpeg";
import * as fsx from "fs-extra";
import * as status from "http-status";
import * as path from "path";
import * as sharp from "sharp";
import {ReadableStreamBuffer} from "stream-buffers";
import globals from "../lib/globals";
import {Group, User} from "../lib/models";
import Route from "../lib/Route";

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const dataDirName = "data";

interface IUploadConfirmation {
    /**
     * Indicates the error that might have occured during the upload
     */
    error?: string;

    /**
     * The file that has been uploaded
     */
    fileName?: string;

    /**
     * If the upload was successful
     */
    success: boolean;
}

type ImageFit = "cover" | "contain" | "fill" | "inside" | "outside";

/**
 * Represents an upload handler.
 */
export class UploadRoute extends Route {

    /**
     * Returns the hash of the current time to be used as a filename.
     */
    private static getFileName() {
        const hash = crypto.createHash("md5");
        hash.update(Number(Date.now()).toString());
        return hash.digest("hex");
    }

    /**
     * The directory where the uploaded data will be saved in
     */
    public readonly dataDir: string;

    constructor(private publicPath: string) {
        super();
        this.router = Router();
        this.dataDir = path.join(this.publicPath, dataDirName);
        ffmpeg.setFfmpegPath(ffmpegPath);
    }

    /**
     * Initializes the route.
     */
    public async init() {
        await fsx.ensureDir(this.dataDir);
        this.router.use(fileUpload({
            limits: config.get<number>("api.maxFileSize"),
        }));
        this.router.use(bodyParser());
        // Uploads a file to the data directory and returns the filename
        this.router.use(async (req, res) => {
            let uploadConfirmation: IUploadConfirmation;
            if (req.session.userId) {
                if (req.files.profilePicture) {
                    uploadConfirmation = await this.uploadProfilePicture(req);
                } else if (req.files.groupPicture) {
                    uploadConfirmation = await this.uploadGroupPicture(req);
                } else {
                    res.status(status.BAD_REQUEST);
                    uploadConfirmation = {
                        error: "You did not provide a (valid) file.",
                        success: false,
                    };
                }
            } else {
                res.status(status.UNAUTHORIZED);
                uploadConfirmation = {
                    error: "You are not logged in.",
                    success: false,
                };
            }
            res.json(uploadConfirmation);
        });
    }

    /**
     * Executed when the route is destroyed
     * @param params
     */
    public async destroy(...params: any): Promise<any> {
        return undefined;
    }

    /**
     * Uploads a file as a users profile picture and deletes the old one.
     * The user gets updated with the new profile picture url.
     * @param request
     */
    private async uploadProfilePicture(request: any): Promise<IUploadConfirmation> {
        let success = false;
        let error: string;
        let fileName: string;
        const profilePic = request.files.profilePicture as UploadedFile;
        try {
            const user = await User.findByPk(request.session.userId);
            if (user) {
                fileName = await this.processAndStoreImage(profilePic.data);
                if (user.profilePicture) {
                    await this.deleteWebFile(user.profilePicture);
                }
                user.profilePicture = fileName;
                await user.save();
                success = true;
            } else {
                error = "User not found";
            }
        } catch (err) {
            globals.logger.error(err.message);
            globals.logger.debug(err.stack);
            error = err.message;
        }
        return {
            error,
            fileName,
            success,
        };
    }

    /**
     * Uploads an avatar image for a group.
     * @param request
     */
    private async uploadGroupPicture(request: any): Promise<IUploadConfirmation> {
        let success = false;
        let error: string;
        let fileName: string;
        const groupPicture = request.files.groupPicture as UploadedFile;
        if (request.body.groupId) {
            try {
                const user = await User.findByPk(request.session.userId);
                const group = await Group.findByPk(request.body.groupId);
                if (!group) {
                    error = `No group with the id '${request.body.groupId}' found.`;
                    return {
                        error,
                        success,
                    };
                }
                const isAdmin = await group.$has("rAdmins", user);
                if (isAdmin) {
                    fileName = await this.processAndStoreImage(groupPicture.data);
                    if (group.picture) {
                        await this.deleteWebFile(group.picture);
                    }
                    group.picture = fileName;
                    await group.save();
                    success = true;
                } else {
                    error = "You are not a group admin.";
                }
            } catch (err) {
                globals.logger.error(err.message);
                globals.logger.debug(err.stack);
                error = err.message;
            }
        } else {
            error = "No groupId provided! (the request body must contain a groupId)";
        }
        return {
            error,
            fileName,
            success,
        };
    }

    /**
     * Converts a file to the webp format and stores it with a uuid filename.
     * The web path for the image is returned.
     * @param data
     * @param width
     * @param height
     * @param fit
     */
    private async processAndStoreImage(data: Buffer, width = 512, height = 512,
                                       fit: ImageFit = "cover"): Promise<string> {
        const fileBasename = UploadRoute.getFileName() + "." + config.get("api.imageFormat");
        await fsx.ensureDir(this.dataDir);
        const filePath = path.join(this.dataDir, fileBasename);
        let image = await sharp(data)
            .resize(width, height, {
                fit,
            })
            .normalise();
        if (config.get<string>("api.imageFormat") === "webp") {
            image = await image.webp({
                reductionEffort: 6,
                smartSubsample: true,
            });
        } else {
            image = await image.png({
                adaptiveFiltering: true,
                colors: 128,
            });
        }
        await image.toFile(filePath);
        return `/${dataDirName}/${fileBasename}`;
    }

    /**
     * Converts a video into a smaller format and .mp4 and returns the web path
     * @param data
     * @param width
     */
    private async processAndStoreVideo(data: Buffer, width: number = 720): Promise<string> {
        return new Promise(async (resolve) => {
            const fileBasename = UploadRoute.getFileName() + ".mp4";
            await fsx.ensureDir(this.dataDir);
            const filePath = path.join(this.dataDir, fileBasename);
            const videoFileStream = new ReadableStreamBuffer({
                chunkSize: 2048,
                frequency: 10,
            });
            videoFileStream.put(data);
            const video = ffmpeg(videoFileStream);
            video
                .on("end", () => {
                    resolve(`/${dataDirName}/${fileBasename}`);
                })
                .size(`${width}x?`)
                .toFormat("libx264")
                .output(filePath);
        });
    }

    /**
     * Deletes an image for a provided web path.
     * @param webPath
     */
    private async deleteWebFile(webPath: string) {
        const realPath = path.join(this.dataDir, path.basename(webPath));
        if (await fsx.pathExists(realPath)) {
            await fsx.unlink(realPath);
        } else {
            globals.logger.warn(`Could not delete web image ${realPath}: Not found!`);
        }
    }
}
