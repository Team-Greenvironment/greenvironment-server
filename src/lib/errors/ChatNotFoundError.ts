import {BaseError} from "./BaseError";

/**
 * An error that is thrown when the chatroom doesn't exist
 */
export class ChatNotFoundError extends BaseError {
    constructor(chatId: number) {
        super(`Chat with id ${chatId} not found.`);
    }
}
