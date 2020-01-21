import * as httpStatus from "http-status";
import dataaccess from "../dataAccess";
import {BaseError} from "./BaseError";

/**
 * An error that is thrown when a request for a sender, receiver and type was not found
 */
export class RequestNotFoundError extends BaseError {
    public readonly statusCode = httpStatus.NOT_FOUND;

    // @ts-ignore
    constructor(sender: number, receiver?: number, type?: dataaccess.RequestType) {
        if (!receiver) {
            super(`Request with id '${sender} not found.'`);
        } else {
            super(`Request with sender '${sender}' and receiver '${receiver}' of type '${type}' not found.`);
        }
    }
}
