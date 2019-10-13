import {GraphQLError} from "graphql";

export class NotLoggedInGqlError extends GraphQLError {
    constructor() {
        super("Not logged in");
    }
}

export class PostNotFoundGqlError extends GraphQLError {
    constructor(postId: number) {
        super(`Post '${postId}' not found!`);
    }
}
