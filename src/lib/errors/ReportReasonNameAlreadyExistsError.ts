import {BaseError} from "./BaseError";

/**
 * An error that is thrown when one tries to create a request with a name that already exists.
 */
export class ReportReasonNameAlreadyExistsError extends BaseError {
    constructor(name: string) {
        super(`A report reason with the name '${name}' already exists!`);
    }
}
