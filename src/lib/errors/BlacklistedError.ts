import {BaseError} from "./BaseError";

/**
 * Represents an error that is thrown when a blacklisted phrase is used.
 */
export class BlacklistedError extends BaseError {

    public readonly statusCode = httpStatus.NOT_ACCEPTABLE;

    constructor(public phrases: string[], field: string = "input") {
        super(`The ${field} contains the blacklisted words: ${phrases.join(", ")}`);
    }
}
