/**
 * Events that are emitted and processsed internally on the server
 */
export enum InternalEvents {
    CHATCREATE = "chatCreate",
    CHATMESSAGE = "chatMessage",
    GQLCHATMESSAGE = "graphqlChatMessage",
    REQUESTCREATE = "requestCreate",
    POSTCREATE = "postCreate",
    GQLPOSTCREATE = "graphqlPostCreate",
}
