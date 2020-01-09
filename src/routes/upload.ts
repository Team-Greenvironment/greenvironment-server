import {Router} from "express";
import {UploadedFile} from "express-fileupload";
import {User} from "../lib/models";
import Route from "../lib/Route";
import * as fsx from "fs-extra";
import globals from "../lib/globals";
import * as path from "path";
import * as crypto from "crypto";
import * as fileUpload from "express-fileupload";
import * as status from "http-status";
import * as sharp from "sharp";

const dataDirName = "data";

/**
 * Represents an upload handler.
 */
export class UploadRoute extends Route {

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
            let success = false;
            let fileName: string;
            let error: string;
            const profilePic = req.files.profilePicture as UploadedFile;
            if (req.session.userId) {
                if (profilePic) {
                    try {
                        const fileBasename = this.getFileName() + ".webp";
                        const filePath = path.join(this.dataDir, fileBasename);
                        await sharp(profilePic.data)
                            .resize(512, 512)
                            .normalise()
                            .webp()
                            .toFile(filePath);
                        fileName = `/${dataDirName}/${fileBasename}`;
                        const user = await User.findByPk(req.session.userId);
                        user.profilePicture = fileName;
                        await user.save();
                        success = true;
                    } catch (err) {
                        globals.logger.error(err.message);
                        globals.logger.debug(err.stack);
                        error = err.message;
                    }
                } else {
                    res.status(status.BAD_REQUEST);
                    error = "You did not provide a (valid) file.";
                }
            } else {
                res.status(status.UNAUTHORIZED);
                error = "You are not logged in.";
            }
            res.json({
                error,
                fileName,
                success,
            });
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
     * Returns the hash of the current time to be used as a filename.
     */
    private getFileName() {
        const hash = crypto.createHash("md5");
        hash.update(Number(Date.now()).toString());
        return hash.digest("hex");
    }
}
