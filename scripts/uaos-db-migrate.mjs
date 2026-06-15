import fs from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import {
  readProductionIntegrationsConfig,
} from "../server/production/config.mjs";

const config = readProductionIntegrationsConfig(
  process.env,
  { strict: true },
);

const migrationPath = path.join(
  process.cwd(),
  "migrations",
  "001_accounts.sql",
);

const sql = await fs.readFile(migrationPath, "utf8");
const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl
    ? { rejectUnauthorized: false }
    : false,
});

try {
  await pool.query(sql);
  console.log("UAOS accounts migration completed.");
} finally {
  await pool.end();
}