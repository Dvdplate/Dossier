export interface Bindings {
  DB: D1Database;
  ASSETS: Fetcher;
  /** Injected in tests to freeze "now" */
  NOW_OVERRIDE?: string;
}
