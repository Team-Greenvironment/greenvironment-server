import {BaseError} from "./BaseError";

/**
 * An error that is thrown when the provided email for registering is already registered with a user
 */
export class EmailAlreadyRegisteredError extends BaseError {
    constructor(email: string) {
        super(`A user for '${email}' does already exist.`);
    }

}
