import {BaseError} from "./BaseError";

export class GroupNotFoundError extends BaseError {
    constructor(groupId: number) {
        super(`Group ${groupId} not found!`);
    }

}
