import {BaseError} from "./BaseError";

/**
 * An error that is thrown when an activity was not found.
 */
export class ActivityNotFoundError extends BaseError {

    public readonly statusCode = httpStatus.NOT_FOUND;

    constructor(id: number) {
        super(`The activity with the id ${id} could not be found.`);
    }
}
