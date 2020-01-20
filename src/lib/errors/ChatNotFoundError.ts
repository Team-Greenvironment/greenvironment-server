import {BaseError} from "./BaseError";

/**
 * An error that is thrown when the chatroom doesn't exist
 */
export class ChatNotFoundError extends BaseError {

    public readonly statusCode = httpStatus.NOT_FOUND;

    constructor(chatId: number) {
        super(`Chat with id ${chatId} not found.`);
    }
}
