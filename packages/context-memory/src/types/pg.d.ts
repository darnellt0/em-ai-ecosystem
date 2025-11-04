declare module 'pg' {
  export class Pool {
    constructor(config?: unknown);
    query<T = any>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
    end(): Promise<void>;
  }
}
