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

/**
 * An error for the frontend that is thrown when a group was not found
 */
export class GroupNotFoundGqlError extends GraphQLError {
    constructor(groupId: number) {
        super(`Group '${groupId}' not found!`);
    }
}

/**
 * An error for the frontend that is thrown when a nonadmin tries to perform an admin operation.
 */
export class NotAnAdminGqlError extends  GraphQLError {
    constructor() {
        super("You are not an admin.");
    }
}
