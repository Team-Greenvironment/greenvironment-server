import {BaseError} from "./BaseError";

export class ActivityNotFoundError extends BaseError {
    constructor(id: number) {
        super(`The activity with the id ${id} could not be found.`);
    }
}
