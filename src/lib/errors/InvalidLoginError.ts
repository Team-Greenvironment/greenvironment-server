import {BaseError} from "./BaseError";

export class InvalidLoginError extends BaseError {
    constructor(email: (string)) {
        super(`Invalid login data for ${email}.`);
    }
}
