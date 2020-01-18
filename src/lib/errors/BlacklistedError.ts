import {BaseError} from "./BaseError";

/**
 * Represents an error that is thrown when a blacklisted phrase is used.
 */
export class BlacklistedError extends BaseError {
    constructor(public phrases: string[], field: string = "input") {
        super(`The ${field} contains the blacklisted words: ${phrases.join(",")}`);
    }
}
