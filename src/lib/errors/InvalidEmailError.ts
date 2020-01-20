import {BaseError} from "./BaseError";

/**
 * An error that is thrown when a user tries to register with an invalid email
 */
export class InvalidEmailError extends BaseError {
    constructor(email: string) {
        super(`'${email}' is not a valid email address!`);
    }
}
