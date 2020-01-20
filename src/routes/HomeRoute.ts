import {Router} from "express";
import {Namespace, Server} from "socket.io";
import dataaccess from "../lib/dataAccess";
import globals from "../lib/globals";
import {InternalEvents} from "../lib/InternalEvents";
import {ChatMessage, ChatRoom, Post, Request, User} from "../lib/models";
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
                    io.emit("post", Object.assign(post, {htmlContent: post.htmlContent}));
                } else {
                    socket.emit("error", "Not logged in!");
                }
            });
            globals.internalEmitter.on(InternalEvents.REQUESTCREATE, async (request: Request) => {
                if ((await request.$get("sender") as User).id === socket.handshake.session.userId) {
                    socket.emit("request", request);
                }
            });
            globals.internalEmitter.on(InternalEvents.GQLPOSTCREATE, async (post: Post) => {
                socket.emit("post", Object.assign(post, {htmlContent: post.htmlContent}));
            });
            globals.internalEmitter.on(InternalEvents.CHATCREATE, async (chat: ChatRoom) => {
                const user = await User.findByPk(socket.handshake.session.userId);
                if (await chat.$has("rMembers", user)) {
                    socket.emit("chatCreate", chat);
                }
            });
        });

        const chats = await dataaccess.getAllChats();
        for (const chat of chats) {
            chatRooms[chat.id] = this.getChatSocketNamespace(chat.id);
        }
        globals.internalEmitter.on(InternalEvents.CHATCREATE, (chat: ChatRoom) => {
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
                    socket.broadcast.emit("chatMessage", Object.assign(message, {htmlContent: message.htmlContent}));
                    socket.emit("chatMessageSent", Object.assign(message, {htmlContent: message.htmlContent}));
                } else {
                    socket.emit("error", "Not logged in!");
                }
            });
            globals.internalEmitter.on(InternalEvents.GQLCHATMESSAGE, async (message: ChatMessage) => {
                if ((await message.$get("chat") as ChatRoom).id === chatId) {
                    socket.emit("chatMessage", Object.assign(message, {htmlContent: message.htmlContent}));
                }
            });
        });
        return chatNs;
    }
}

export default HomeRoute;
