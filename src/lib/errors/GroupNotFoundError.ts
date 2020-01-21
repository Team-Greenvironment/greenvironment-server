import * as httpStatus from "http-status";
import {BaseError} from "./BaseError";

/**
 * An error that is thrown when a group was not found for a specified id
 */
export class GroupNotFoundError extends BaseError {

    public readonly statusCode = httpStatus.NOT_FOUND;

    constructor(groupId: number) {
        super(`Group ${groupId} not found!`);
    }
}
