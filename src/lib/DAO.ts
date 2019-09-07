import {Pool} from "pg";
import globals from "./globals";
import {QueryHelper} from "./QueryHelper";

const config = globals.config;
const tableCreationFile = __dirname + "/../sql/create-tables.sql";

export class DAO {
    private queryHelper: QueryHelper;
    constructor() {
        const dbClient: Pool = new Pool({
            database: config.database.database,
            host: config.database.host,
            password: config.database.password,
            port: config.database.port,
            user: config.database.user,
        });
        this.queryHelper = new QueryHelper(dbClient, tableCreationFile);
    }

    /**
     * Initializes everything that needs to be initialized asynchronous.
     */
    public async init() {
        await this.queryHelper.createTables();
    }
}
