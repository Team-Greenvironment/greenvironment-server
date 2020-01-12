import * as crypto from "crypto";
import {Router} from "express";
import * as fileUpload from "express-fileupload";
import {UploadedFile} from "express-fileupload";
import * as fsx from "fs-extra";
import * as status from "http-status";
import * as path from "path";
import * as sharp from "sharp";
import globals from "../lib/globals";
import {User} from "../lib/models";
import Route from "../lib/Route";

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
    }

    /**
     * Initializes the route.
     */
    public async init() {
        await fsx.ensureDir(this.dataDir);
        this.router.use(fileUpload());
        // Uploads a file to the data directory and returns the filename
        this.router.use(async (req, res) => {
            let uploadConfirmation: IUploadConfirmation;
            if (req.session.userId) {
                if (req.files.profilePicture) {
                    uploadConfirmation = await this.uploadProfilePicture(req);
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
            const fileBasename = UploadRoute.getFileName() + ".webp";
            const filePath = path.join(this.dataDir, fileBasename);
            await sharp(profilePic.data)
                .resize(512, 512)
                .normalise()
                .webp({smartSubsample: true, reductionEffort: 6})
                .toFile(filePath);
            fileName = `/${dataDirName}/${fileBasename}`;
            const user = await User.findByPk(request.session.userId);
            const oldProfilePicture = path.join(this.dataDir, path.basename(user.profilePicture));
            if (await fsx.pathExists(oldProfilePicture)) {
                await fsx.unlink(oldProfilePicture);
            } else {
                globals.logger.warn(`Could not delete ${oldProfilePicture}: Not found!`);
            }
            user.profilePicture = fileName;
            await user.save();
            success = true;
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
}
