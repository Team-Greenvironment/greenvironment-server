import dataaccess from "../dataaccess";
import {BaseError} from "./BaseError";

export class RequestNotFoundError extends BaseError {
    constructor(sender: number, receiver: number, type: dataaccess.RequestType) {
        super(`Request with sender '${sender}' and receiver '${receiver}' of type '${type}' not found.`);
    }

}
