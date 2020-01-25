import {BaseError} from "./BaseError";

/**
 * An error that is thrown when the level already exists
 */
export class LevelAlreadyExistsError extends BaseError {
    constructor(property: string) {
        super(`A level with the property value '${property}' already exists`);
    }
}
