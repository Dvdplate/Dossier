export interface Bindings {
  DB: D1Database;
  ASSETS: Fetcher;
  AUTH_TOKEN?: string;
  /** Injected in tests to freeze "now" */
  NOW_OVERRIDE?: string;
}
