import dataaccess from "./index";
import {User} from "./User";

/**
 * Represents a request to a user.
 */
export class Request {
    constructor(
        public readonly sender: User,
        public readonly receiver: User,
        public readonly type: dataaccess.RequestType) {
    }

    /**
     * Returns the resolved request data.
     */
    public resolvedData() {
        return {
            receiverId: this.receiver.id,
            senderId: this.sender.id,
            type: this.type,
        };
    }
}
