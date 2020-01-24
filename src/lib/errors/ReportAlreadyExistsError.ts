import {BaseError} from "./BaseError";

/**
 * An error that is thrown when a user tries to report the same post twice
 */
export class ReportAlreadyExistsError extends BaseError {
    constructor() {
        super("You've already reported this post for that reason.");
    }
}
