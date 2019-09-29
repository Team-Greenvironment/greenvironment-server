import * as crypto from "crypto";
import {EventEmitter} from "events";

export class MemoryCache extends EventEmitter {
    private cacheItems: any = {};
    private cacheExpires: any = {};
    private expireCheck: NodeJS.Timeout;

    /**
     * Creates interval function.
     * @param ttl
     */
    constructor(private ttl: number = 500) {
        super();
        this.expireCheck = setInterval(() => this.checkExpires(), ttl / 2);
    }

    /**
     * Creates a md5 hash of the given key.
     * @param key
     */
    public hashKey(key: string): string {
        const hash = crypto.createHash("md5");
        const data = hash.update(key, "utf8");
        return data.digest("hex");
    }

    /**
     * Sets an entry.
     * @param key
     * @param value
     */
    public set(key: string, value: any) {
        this.cacheItems[key] = value;
        this.cacheExpires[key] = Date.now() + this.ttl;
        this.emit("set", key, value);
    }

    /**
     * Returns the entry stored with the given key.
     * @param key
     */
    public get(key: string) {
        if (this.cacheItems.hasOwnProperty(key)) {
            this.emit("hit", key, this.cacheItems[key]);
            return this.cacheItems[key];
        } else {
            this.emit("miss", key);
        }
    }

    /**
     * Deletes a cache item.
     * @param key
     */
    public delete(key: string) {
        this.emit("delete", key);
        delete this.cacheItems[key];
    }

    /**
     * Checks expires and clears items that are over the expire value.
     */
    private checkExpires() {
        for (const [key, value] of Object.entries(this.cacheExpires)) {
            if (value < Date.now()) {
                this.emit("delete", key);
                delete this.cacheItems[key];
                delete this.cacheExpires[key];
            }
        }
    }
}
