import {BaseError} from "./BaseError";

/**
 * An error that is thrown when a specified user was not found
 */
export class UserNotFoundError extends BaseError {

    public readonly statusCode = httpStatus.NOT_FOUND;

    constructor(username: (string | number)) {
        super(`User ${username} not found!`);
    }
}
