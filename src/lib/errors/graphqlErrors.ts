import {GraphQLError} from "graphql";
import {BaseError} from "./BaseError";

export class NotLoggedInGqlError extends GraphQLError {

    constructor() {
        super("Not logged in");
    }
}
