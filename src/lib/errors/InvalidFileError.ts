import * as httpStatus from "http-status";
import {BaseError} from "./BaseError";

/**
 * An error that is thrown when a invalid file type is uploaded
 */
export class InvalidFileError extends BaseError {

    public readonly statusCode = httpStatus.NOT_ACCEPTABLE;

    constructor(mimetype: string) {
        super(`The mimetype '${mimetype}' is not allowed.`);
    }
}
