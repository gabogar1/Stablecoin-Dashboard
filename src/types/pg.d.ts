declare module 'pg' {
  export interface QueryResult<T = unknown> {
    rows: T[];
    rowCount: number;
    command: string;
    oid: number;
    fields: Array<{ name: string } & Record<string, unknown>>;
  }

  export interface PoolConfig {
    connectionString?: string;
    ssl?: boolean | { rejectUnauthorized?: boolean };
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    query<T = unknown>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
    end(): Promise<void>;
  }
}

