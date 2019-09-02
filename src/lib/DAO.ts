import {Pool} from "pg";
import globals from "./globals";
import {QueryHelper} from "./QueryHelper";

const config = globals.config;

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
        this.queryHelper = new QueryHelper(dbClient);
    }
}
