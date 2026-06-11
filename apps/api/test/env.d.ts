declare module "cloudflare:test" {
  interface ProvidedEnv {
    DB: D1Database;
    NOW_OVERRIDE?: string;
    TEST_MIGRATIONS: D1Migration[];
  }
}
