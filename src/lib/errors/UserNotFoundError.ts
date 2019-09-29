import {BaseError} from "./BaseError";

export class UserNotFoundError extends BaseError {
    constructor(username: string) {
        super(`User ${username} not found!`);
    }
}
