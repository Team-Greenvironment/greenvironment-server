import * as bodyParser from "body-parser";
import * as config from "config";
import * as crypto from "crypto";
import {Router} from "express";
import {UploadedFile} from "express-fileupload";
import * as fileUpload from "express-fileupload";
import * as fsx from "fs-extra";
import * as status from "http-status";
import * as path from "path";
import globals from "../lib/globals";
import {Group, Post, User} from "../lib/models";
import {Media} from "../lib/models/Media";
import {is} from "../lib/regex";
import Route from "../lib/Route";
import {UploadManager} from "../lib/UploadManager";

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
    private uploadManager: UploadManager;

    constructor(private publicPath: string) {
        super();
        this.router = Router();
        this.dataDir = path.join(this.publicPath, dataDirName);
        this.uploadManager = new UploadManager();
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
                } else if (req.files.postMedia) {
                    uploadConfirmation = await this.uploadPostMedia(req);
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
            const user = await User.findByPk(request.session.userId, {include: [Media]});
            if (user) {
                const media = await this.uploadManager.processAndStoreImage(profilePic.data);
                if (user.mediaId) {
                    const previousMedia = await user.$get("rMedia") as Media;
                    await previousMedia.destroy();
                }
                await user.$set("rMedia", media);
                fileName = media.url;
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
                const group = await Group.findByPk(request.body.groupId, {include: [Media]});
                if (!group) {
                    error = `No group with the id '${request.body.groupId}' found.`;
                    return {
                        error,
                        success,
                    };
                }
                const isAdmin = await group.$has("rAdmins", user);
                if (isAdmin) {
                    const media = await this.uploadManager.processAndStoreImage(groupPicture.data);
                    if (group.mediaId) {
                        const previousMedia = await group.$get("rMedia") as Media;
                        await previousMedia.destroy();
                    }
                    await group.$set("rMedia", media);
                    fileName = media.url;
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
     * Uploads a media file for a post
     * @param request
     */
    private async uploadPostMedia(request: any) {
        let error: string;
        let fileName: string;
        let success = false;
        const postId = request.body.postId;
        const postMedia = request.files.postMedia as UploadedFile;
        if (postId) {
            try {
                let media: Media;
                const post = await Post.findByPk(postId);
                if (post.authorId === request.session.userId) {
                    if (is.image(postMedia.mimetype)) {
                        media = await this.uploadManager.processAndStoreImage(postMedia.data, 1080, 720, "inside");
                    } else if (is.video(postMedia.mimetype)) {
                        media = await this.uploadManager.processAndStoreVideo(postMedia.data, postMedia.mimetype
                            .replace("video/", ""));
                    } else {
                        error = "Wrong type of file provided";
                    }
                    if (media) {
                        await post.$set("rMedia", media);
                        post.visible = true;
                        await post.save();
                        fileName = media.url;
                        success = true;
                    }
                } else {
                    error = "You are not the author of the post";
                }
            } catch (err) {
                error = err.message;
                globals.logger.error(err.message);
                globals.logger.debug(err.stack);
            }
        } else {
            error = "No post Id provided";
        }

        return {
            error,
            fileName,
            success,
        };
    }
}
