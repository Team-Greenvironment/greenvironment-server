abstract class DataObject {
    protected dataLoaded: boolean = false;

    constructor(public id: number, protected row?: any) {
    }

    protected abstract loadData(): Promise<void>;

    protected loadDataIfNotExists() {
        if (this.dataLoaded) {
            this.loadData();
        }
    }
}
