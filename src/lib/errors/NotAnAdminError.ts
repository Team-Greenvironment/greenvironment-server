import * as httpStatus from "http-status";
import {BaseError} from "./BaseError";

/**
 * An error that is thrown when a non admin tries to perform an admin action
 */
export class NotAnAdminError extends BaseError {

    public readonly statusCode = httpStatus.FORBIDDEN;

    constructor() {
        super("You are not a site admin!");
    }
}
