import {BaseError} from "./BaseError";

/**
 * An error that is thrown when the user changes the handle to a value that is already used by a different user
 */
export class HandleInUseError extends BaseError {
    constructor(handle: string) {
        super(`A different user is already using the handle '${handle}'!`);
    }
}
