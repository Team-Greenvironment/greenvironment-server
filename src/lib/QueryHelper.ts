import {Pool, PoolClient, QueryConfig, QueryResult} from "pg";
import globals from "./globals";

const logger = globals.logger;

export class SqlTransaction {
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
    public async release() {
        this.client.release();
    }
}

export class QueryHelper {
    private pool: Pool;

    constructor(pgPool: Pool) {
        this.pool = pgPool;
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
            logger.debug(`Error on query "${query}".`);
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
