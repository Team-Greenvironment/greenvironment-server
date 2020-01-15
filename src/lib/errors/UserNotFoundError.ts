import {BaseError} from "./BaseError";

/**
 * An error that is thrown when a specified user was not found
 */
export class UserNotFoundError extends BaseError {
    constructor(username: (string | number)) {
        super(`User ${username} not found!`);
    }
}
