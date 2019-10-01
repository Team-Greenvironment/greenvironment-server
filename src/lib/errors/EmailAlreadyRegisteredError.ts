import {BaseError} from "./BaseError";

export class EmailAlreadyRegisteredError extends BaseError {
    constructor(email: string) {
        super(`A user for '${email}' does already exist.`);
    }

}
