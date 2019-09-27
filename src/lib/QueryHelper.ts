/**
 * @author Trivernis
 * @remarks
 *
 * Taken from {@link https://github.com/Trivernis/whooshy}
 */

import * as fsx from "fs-extra";
import {Pool, PoolClient, QueryConfig, QueryResult} from "pg";
import globals from "./globals";

const logger = globals.logger;

/**
 * Transaction class to wrap SQL transactions.
 */
export class SqlTransaction {
    /**
     * Constructor.
     * @param client
     */
    constructor(private client: PoolClient) {
    }

    /**
     * Begins the transaction.
     */
    public async begin() {
        return await this.client.query("BEGIN");
    }

    /**
     * Commits the transaction
     */
    public async commit() {
        return await this.client.query("COMMIT");
    }

    /**
     * Rolls back the transaction
     */
    public async rollback() {
        return await this.client.query("ROLLBACK");
    }

    /**
     * Executes a query inside the transaction.
     * @param query
     */
    public async query(query: QueryConfig) {
        return await this.client.query(query);
    }

    /**
     * Releases the client back to the pool.
     */
    public release() {
        this.client.release();
    }
}

/**
 * Query helper for easyer fetching of a specific row count.
 */
export class QueryHelper {
    private pool: Pool;

    /**
     * Constructor.
     * @param pgPool
     * @param [tableCreationFile]
     * @param [tableUpdateFile]
     */
    constructor(pgPool: Pool, private tableCreationFile?: string, private tableUpdateFile?: string) {
        this.pool = pgPool;
    }

    /**
     * creates all tables needed if a filepath was given with the constructor
     */
    public async createTables() {
        if (this.tableCreationFile) {
            logger.info("Creating nonexistent tables...");
            const tableSql = await fsx.readFile(this.tableCreationFile, "utf-8");
            await this.query({text: tableSql});
        }
    }

    /**
     * Updates the definition of the tables if the table update file was passed in the constructor
     */
    public async updateTableDefinitions() {
        if (this.tableUpdateFile) {
            logger.info("Updating table definitions...");
            const tableSql = await fsx.readFile(this.tableUpdateFile, "utf-8");
            await this.query({text: tableSql});
        }
    }

    /**
     * executes the sql query with values and returns all results.
     * @param query
     */
    public async all(query: QueryConfig): Promise<any[]> {
        const result = await this.query(query);
        return result.rows;
    }

    /**
     * executes the sql query with values and returns the first result.
     * @param query
     */
    public async first(query: QueryConfig): Promise<any> {
        const result = await this.query(query);
        if (result.rows && result.rows.length > 0) {
            return result.rows[0];
        }
    }

    /**
     * Creates a new Transaction to be uses with error handling.
     */
    public async createTransaction() {
        const client: PoolClient = await this.pool.connect();
        return new SqlTransaction(client);
    }

    /**
     * Queries the database with error handling.
     * @param query - the sql and values to execute
     */
    private async query(query: QueryConfig): Promise<QueryResult|{rows: any}> {
        try {
            return await this.pool.query(query);
        } catch (err) {
            logger.debug(`Error on query "${JSON.stringify(query)}".`);
            logger.error(`Sql query failed: ${err}`);
            logger.verbose(err.stack);
            return {
                rows: null,
            };
        }
    }
}

/**
 * Returns the parameterized value sql for inserting
 * @param columnCount
 * @param rowCount
 * @param [offset]
 */
export function buildSqlParameters(columnCount: number, rowCount: number, offset?: number): string {
    let sql = "";
    for (let i = 0; i < rowCount; i++) {
        sql += "(";
        for (let j = 0; j < columnCount; j++) {
            sql += `$${(i * columnCount) + j + 1 + offset},`;
        }
        sql = sql.replace(/,$/, "") + "),";
    }
    return sql.replace(/,$/, "");
}
