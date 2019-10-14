import {BaseError} from "./BaseError";

export class UserNotFoundError extends BaseError {
    constructor(username: (string|number)) {
        super(`User ${username} not found!`);
    }
}
