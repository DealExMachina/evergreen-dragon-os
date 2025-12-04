import type { DuckDBConnectionManager } from './connection';
import { getLogger } from '@evergreen/shared-utils';
import { DuckDBError } from '@evergreen/shared-utils';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: Array<{ column: string; direction: 'ASC' | 'DESC' }>;
  where?: Array<{ column: string; operator: string; value: unknown }>;
}

/**
 * Builds and executes analytical queries against DuckDB
 */
export class QueryBuilder {
  private selectColumns: string[] = [];
  private fromTable: string | null = null;
  private joins: Array<{ type: string; table: string; condition: string }> = [];
  private whereConditions: Array<{ column: string; operator: string; value: unknown }> = [];
  private groupByColumns: string[] = [];
  private havingConditions: Array<{ column: string; operator: string; value: unknown }> = [];
  private orderByClauses: Array<{ column: string; direction: 'ASC' | 'DESC' }> = [];
  private limitValue: number | null = null;
  private offsetValue: number | null = null;

  constructor(private connectionManager: DuckDBConnectionManager) {}

  /**
   * Selects columns
   */
  select(columns: string | string[]): this {
    this.selectColumns = Array.isArray(columns) ? columns : [columns];
    return this;
  }

  /**
   * Sets the FROM table
   */
  from(table: string): this {
    this.fromTable = table;
    return this;
  }

  /**
   * Adds a JOIN clause
   */
  join(table: string, condition: string, type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' = 'INNER'): this {
    this.joins.push({ type, table, condition });
    return this;
  }

  /**
   * Adds a WHERE condition
   */
  where(column: string, operator: string, value: unknown): this {
    this.whereConditions.push({ column, operator, value });
    return this;
  }

  /**
   * Adds a GROUP BY clause
   */
  groupBy(columns: string | string[]): this {
    this.groupByColumns = Array.isArray(columns) ? columns : [columns];
    return this;
  }

  /**
   * Adds a HAVING condition
   */
  having(column: string, operator: string, value: unknown): this {
    this.havingConditions.push({ column, operator, value });
    return this;
  }

  /**
   * Adds an ORDER BY clause
   */
  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByClauses.push({ column, direction });
    return this;
  }

  /**
   * Sets LIMIT
   */
  limit(value: number): this {
    this.limitValue = value;
    return this;
  }

  /**
   * Sets OFFSET
   */
  offset(value: number): this {
    this.offsetValue = value;
    return this;
  }

  /**
   * Builds the SQL query
   */
  build(): { sql: string; params: unknown[] } {
    if (!this.fromTable) {
      throw new DuckDBError('FROM clause is required');
    }

    if (this.selectColumns.length === 0) {
      this.selectColumns = ['*'];
    }

    const parts: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // SELECT
    parts.push(`SELECT ${this.selectColumns.join(', ')}`);

    // FROM
    parts.push(`FROM ${this.fromTable}`);

    // JOINs
    for (const join of this.joins) {
      parts.push(`${join.type} JOIN ${join.table} ON ${join.condition}`);
    }

    // WHERE
    if (this.whereConditions.length > 0) {
      const whereClauses = this.whereConditions.map((cond) => {
        const placeholder = `$${paramIndex}`;
        paramIndex++;
        params.push(cond.value);
        return `${cond.column} ${cond.operator} ${placeholder}`;
      });
      parts.push(`WHERE ${whereClauses.join(' AND ')}`);
    }

    // GROUP BY
    if (this.groupByColumns.length > 0) {
      parts.push(`GROUP BY ${this.groupByColumns.join(', ')}`);
    }

    // HAVING
    if (this.havingConditions.length > 0) {
      const havingClauses = this.havingConditions.map((cond) => {
        const placeholder = `$${paramIndex}`;
        paramIndex++;
        params.push(cond.value);
        return `${cond.column} ${cond.operator} ${placeholder}`;
      });
      parts.push(`HAVING ${havingClauses.join(' AND ')}`);
    }

    // ORDER BY
    if (this.orderByClauses.length > 0) {
      const orderClauses = this.orderByClauses.map((clause) => `${clause.column} ${clause.direction}`);
      parts.push(`ORDER BY ${orderClauses.join(', ')}`);
    }

    // LIMIT
    if (this.limitValue !== null) {
      parts.push(`LIMIT ${this.limitValue}`);
    }

    // OFFSET
    if (this.offsetValue !== null) {
      parts.push(`OFFSET ${this.offsetValue}`);
    }

    return {
      sql: parts.join(' '),
      params,
    };
  }

  /**
   * Executes the query and returns results
   */
  async execute<T = unknown>(): Promise<T[]> {
    const { sql, params } = this.build();
    const logger = getLogger();
    logger.debug('Executing DuckDB query', { sql, paramCount: params.length });

    const connection = this.connectionManager.getConnection();

    return new Promise((resolve, reject) => {
      connection.all(sql, ...params, (err: Error | null, result: T[]) => {
        if (err) {
          logger.error('Query execution failed', { error: err, sql });
          reject(new DuckDBError('Query execution failed', { sql, error: err.message }));
        } else {
          logger.debug('Query executed successfully', { rowCount: result.length });
          resolve(result);
        }
      });
    });
  }

  /**
   * Executes the query and returns first result
   */
  async executeOne<T = unknown>(): Promise<T | null> {
    const results = await this.limit(1).execute<T>();
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Executes the query and returns count
   */
  async count(): Promise<number> {
    const originalSelect = [...this.selectColumns];
    this.selectColumns = ['COUNT(*) as count'];
    const result = await this.executeOne<{ count: number }>();
    this.selectColumns = originalSelect;
    return result?.count || 0;
  }
}

