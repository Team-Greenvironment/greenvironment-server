import {BaseError} from "./BaseError";

/**
 * An error that is thrown when a group was not found for a specified id
 */
export class GroupNotFoundError extends BaseError {
    constructor(groupId: number) {
        super(`Group ${groupId} not found!`);
    }
}
