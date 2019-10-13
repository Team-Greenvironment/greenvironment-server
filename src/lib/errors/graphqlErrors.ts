import {GraphQLError} from "graphql";

export class NotLoggedInGqlError extends GraphQLError {

    constructor() {
        super("Not logged in");
    }
}
