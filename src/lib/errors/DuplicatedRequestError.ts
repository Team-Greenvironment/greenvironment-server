import {BaseError} from "./BaseError";

export class DuplicatedRequestError extends BaseError {
    constructor() {
        super(`Request already exists.`);
    }
}
