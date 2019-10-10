/**
 * abstact DataObject class
 */
import {EventEmitter} from "events";

export abstract class DataObject extends EventEmitter {
    protected dataLoaded: boolean = false;
    private loadingData: boolean = false;

    constructor(public id: number, protected row?: any) {
        super();
        this.id = Number(id);
    }

    /**
     * Returns if the object extists by trying to load data.
     */
    public async exists() {
        await this.loadDataIfNotExists();
        return this.dataLoaded;
    }

    protected abstract loadData(): Promise<void>;

    /**
     * Loads data from the database if data has not been loaded
     */
    protected async loadDataIfNotExists() {
        if (!this.dataLoaded && !this.loadingData) {
            this.loadingData = true;
            await this.loadData();
            this.loadingData = false;
            this.emit("loaded");
        } else if (this.loadingData) {
            return new Promise((res) => {
                this.on("loaded", () => res());
            });
        }
    }
}
