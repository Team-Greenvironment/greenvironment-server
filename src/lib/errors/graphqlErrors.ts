import {GraphQLError} from "graphql";

/**
 * An error for the frontend that is thrown when the user is not logged in
 */
export class NotLoggedInGqlError extends GraphQLError {
    constructor() {
        super("Not logged in");
    }
}

/**
 * An error for the frontend that is thrown when a post was not found
 */
export class PostNotFoundGqlError extends GraphQLError {
    constructor(postId: number) {
        super(`Post '${postId}' not found!`);
    }
}
