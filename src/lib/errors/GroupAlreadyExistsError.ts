import {BaseError} from "./BaseError";

/**
 * An error that is thrown when a group already exists on creation request
 */
export class GroupAlreadyExistsError extends BaseError {
    constructor(name: string) {
        super(`A group with the name "${name}" already exists.`);
    }
}
