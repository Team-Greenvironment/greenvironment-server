import {BaseError} from "./BaseError";

/**
 * An error that is thrown when an activity was not found.
 */
export class ActivityNotFoundError extends BaseError {
    constructor(id: number) {
        super(`The activity with the id ${id} could not be found.`);
    }
}
