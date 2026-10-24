/**
 * PostgreSQL واقعی برای توسعه محلی، بدون نصب یا Docker.
 * اجرا: npm run db:dev   (تا وقتی این پنجره باز است دیتابیس روشن است)
 * داده‌ها در data/pg می‌مانند.
 */
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";

const url = new URL(process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5433/asalnoja");
const dir = path.join(process.cwd(), "data", "pg");
const dbName = url.pathname.slice(1) || "asalnoja";

const pg = new EmbeddedPostgres({
  databaseDir: dir,
  user: decodeURIComponent(url.username || "postgres"),
  password: decodeURIComponent(url.password || "postgres"),
  port: Number(url.port || 5433),
  persistent: true,
  // بدون این، روی ویندوز کلاستر با کدگذاری محلی ساخته می‌شود و متن فارسی ذخیره نمی‌شود
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  onLog: () => {},
});

async function main() {
  if (!existsSync(path.join(dir, "PG_VERSION"))) await pg.initialise();
  await pg.start();
  const client = pg.getPgClient();
  await client.connect();
  const { rowCount } = await client.query("select 1 from pg_database where datname = $1", [dbName]);
  await client.end();
  if (!rowCount) await pg.createDatabase(dbName);
  console.log(`✓ PostgreSQL روی پورت ${url.port || 5433} آماده است (دیتابیس: ${dbName}). برای توقف Ctrl+C`);

  const stop = async () => {
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch(async (e) => {
  console.error(e);
  await pg.stop().catch(() => {});
  process.exit(1);
});
