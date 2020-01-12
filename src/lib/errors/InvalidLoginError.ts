import {BaseError} from "./BaseError";

/**
 * An error that is thrown when a user provides invalid login data for a login request
 */
export class InvalidLoginError extends BaseError {
    constructor(email: (string)) {
        super(`Invalid login data for ${email}.`);
    }
}
