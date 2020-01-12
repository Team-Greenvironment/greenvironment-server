import {BaseError} from "./BaseError";

/**
 * An error that is thrown when no action was specified on a group membership change
 */
export class NoActionSpecifiedError extends BaseError {
    constructor(actions?: any) {
        if (actions) {
            super(`No action of '${Object.keys(actions).join(", ")}'`);
        } else {
            super("No action specified!");
        }
    }
}
