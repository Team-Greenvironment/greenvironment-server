import * as httpStatus from "http-status";
import {BaseError} from "./BaseError";

/**
 * An error that is thrown when a post was not found
 */
export class PostNotFoundError extends BaseError {

    public readonly statusCode = httpStatus.NOT_FOUND;

    constructor(postId: number) {
        super(`Post '${postId}' not found!`);
    }
}
