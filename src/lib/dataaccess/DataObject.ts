/**
 * abstact DataObject class
 */
export abstract class DataObject {
    protected dataLoaded: boolean = false;

    constructor(public id: number, protected row?: any) {
    }

    protected abstract loadData(): Promise<void>;

    /**
     * Loads data from the database if data has not been loaded
     */
    protected loadDataIfNotExists() {
        if (this.dataLoaded) {
            this.loadData();
        }
    }
}
