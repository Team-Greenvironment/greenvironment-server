import {BaseError} from "./BaseError";

/**
 * An error that is thrown when a post was not found
 */
export class PostNotFoundError extends BaseError {
    constructor(postId: number) {
        super(`Post '${postId}' not found!`);
    }
}
