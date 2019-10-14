import {BaseError} from "./BaseError";

export class NoActionSpecifiedError extends BaseError {
    constructor(actions?: any) {
        if (actions) {
            super(`No action of '${Object.keys(actions).join(", ")}'`);
        } else {
            super("No action specified!");
        }
    }
}
