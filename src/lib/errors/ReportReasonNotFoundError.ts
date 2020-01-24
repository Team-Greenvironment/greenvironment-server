import * as httpStatus from "http-status";
import {BaseError} from "./BaseError";

/**
 * An  error that is thrown when a report reason could not be found
 */
export class ReportReasonNotFoundError extends BaseError {

    public readonly statusCode = httpStatus.NOT_FOUND;

    constructor(reasonId: number) {
        super(`A reason with the id '${reasonId}' could not be found`);
    }
}
