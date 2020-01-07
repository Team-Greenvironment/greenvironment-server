import {BaseError} from "./BaseError";

export class GroupAlreadyExistsError extends BaseError {
    constructor(name: string) {
        super(`A group with the name "${name}" already exists.`);
    }
}
