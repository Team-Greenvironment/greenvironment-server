import {BaseError} from "./BaseError";

export class ChatNotFoundError extends BaseError {
    constructor(chatId: number) {
        super(`Chat with id ${chatId} not found.`);
    }
}
