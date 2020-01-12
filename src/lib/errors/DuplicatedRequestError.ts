import {BaseError} from "./BaseError";

/**
 * An error that is thrown when a request of a specific type already exists
 */
export class DuplicatedRequestError extends BaseError {
    constructor() {
        super(`Request already exists.`);
    }
}
