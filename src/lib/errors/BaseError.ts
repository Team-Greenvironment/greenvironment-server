import {GraphQLError} from "graphql";

/**
 * Base error class.
 */
export class BaseError extends Error {
    /**
     * The graphql error with a frontend error message
     */
    public readonly graphqlError: GraphQLError;

    constructor(message?: string, friendlyMessage?: string) {
        super(message);
        this.graphqlError = new GraphQLError(friendlyMessage || message);
    }
}
