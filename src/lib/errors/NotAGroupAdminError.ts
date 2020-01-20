import * as httpStatus from "http-status";
import {BaseError} from "./BaseError";

/**
 * An error that is thrown when a non-admin tries to perform an admin action
 */
export class NotAGroupAdminError extends BaseError {
    public readonly statusCode = httpStatus.FORBIDDEN;

    constructor(groupId: number) {
        super(`You are not an admin of '${groupId}'`);
    }

}
