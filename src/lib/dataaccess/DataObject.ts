/**
 * abstact DataObject class
 */
export abstract class DataObject {
    protected dataLoaded: boolean = false;

    constructor(public id: number, protected row?: any) {
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
        if (!this.dataLoaded) {
            await this.loadData();
        }
    }
}
