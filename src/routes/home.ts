import {Router} from "express";
import {Namespace, Server} from "socket.io";
import dataaccess from "../lib/dataaccess";
import {ChatMessage} from "../lib/dataaccess/ChatMessage";
import {Chatroom} from "../lib/dataaccess/Chatroom";
import {Post} from "../lib/dataaccess/Post";
import {Request} from "../lib/dataaccess/Request";
import globals from "../lib/globals";
import {InternalEvents} from "../lib/InternalEvents";
import Route from "../lib/Route";

/**
 * list of chatroom socket namespaces.
 */
const chatRooms: Namespace[] = [];

/**
 * Class for the home route.
 */
class HomeRoute extends Route {
    /**
     * Constructor, creates new router.
     */
    constructor() {
        super();
        this.router = Router();
    }

    /**
     * Asynchronous init for socket.io.
     * @param io - the io instance
     */
    public async init(io: Server) {
        this.io = io;

        io.on("connection", (socket) => {
            socket.on("postCreate", async (content) => {
                if (socket.handshake.session.userId) {
                    const post = await dataaccess.createPost(content, socket.handshake.session.userId);
                    io.emit("post", await post.resolvedData());
                } else {
                    socket.emit("error", "Not logged in!");
                }
            });
            globals.internalEmitter.on(InternalEvents.REQUESTCREATE, (request: Request) => {
                if (request.receiver.id === socket.handshake.session.userId) {
                    socket.emit("request", request.resolvedData());
                }
            });
            globals.internalEmitter.on(InternalEvents.GQLPOSTCREATE, async (post: Post) => {
                socket.emit("post", await post.resolvedData());
            });
        });

        const chats = await dataaccess.getAllChats();
        for (const chat of chats) {
            chatRooms[chat.id] = this.getChatSocketNamespace(chat.id);
        }
        globals.internalEmitter.on(InternalEvents.CHATCREATE, (chat: Chatroom) => {
            chatRooms[chat.id] = this.getChatSocketNamespace(chat.id);
        });
    }

    /**
     * Destroys the instance by dereferencing the router and resolver.
     */
    public async destroy(): Promise<void> {
        this.router = null;
    }

    /**
     * Returns the namespace socket for a chat socket.
     * @param chatId
     */
    private getChatSocketNamespace(chatId: number) {
        if (chatRooms[chatId]) {
            return chatRooms[chatId];
        }
        const chatNs = this.io.of(`/chat/${chatId}`);
        chatNs.on("connection", (socket) => {
            socket.on("chatMessage", async (content) => {
                if (socket.handshake.session.userId) {
                    const userId = socket.handshake.session.userId;
                    const message = await dataaccess.sendChatMessage(userId, chatId, content);
                    socket.broadcast.emit("chatMessage", message.resolvedContent());
                    socket.emit("chatMessageSent", message.resolvedContent());
                } else {
                    socket.emit("error", "Not logged in!");
                }
            });
            globals.internalEmitter.on(InternalEvents.GQLCHATMESSAGE, (message: ChatMessage) => {
                if (message.chat.id === chatId) {
                    socket.emit("chatMessage", message.resolvedContent());
                }
            });
        });
        return chatNs;
    }
}

export default HomeRoute;
