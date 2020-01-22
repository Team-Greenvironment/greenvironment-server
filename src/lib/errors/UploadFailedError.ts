import {BaseError} from "./BaseError";

/**
 * An error that is thrown when a file failed to upload
 */
export class UploadFailedError extends BaseError {
    constructor() {
        super("Failed to upload the file");
    }
}
