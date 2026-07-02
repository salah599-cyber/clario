/**
 * Idempotently applies public markets columns to existing production database.
 * Uses pg directly so we never invoke Prisma Migrate (avoids P3005 on Vercel).
 *
 * Run manually:
 *   node scripts/sync-public-markets-schema.cjs
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function getDatabaseUrl() {
  return (
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL
  );
}

function splitSqlStatements(sql) {
  return sql
    .split(/;\s*(?:\n|$)/)
    .map((chunk) =>
      chunk
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter(Boolean);
}

function isIgnorableSchemaError(message) {
  return (
    message.includes("already exists") ||
    message.includes("duplicate_object") ||
    message.includes("duplicate key") ||
    message.includes("IF NOT EXISTS")
  );
}

async function columnExists(client, tableName, columnName) {
  const result = await client.query(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
    )`,
    [tableName, columnName],
  );
  return Boolean(result.rows[0]?.exists);
}

async function main() {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    console.log("No database URL set; skipping public markets schema sync.");
    return;
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    if (await columnExists(client, "PublicEquityHolding", "market")) {
      console.log("Public markets schema already present; nothing to do.");
      return;
    }

    const sqlPath = path.join(__dirname, "..", "lib", "db", "public-markets-schema.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    const statements = splitSqlStatements(sql);

    for (const statement of statements) {
      try {
        await client.query(statement);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (isIgnorableSchemaError(message)) continue;
        throw error;
      }
    }

    if (!(await columnExists(client, "PublicEquityHolding", "market"))) {
      throw new Error(
        "Public markets schema sync finished but PublicEquityHolding.market is still missing.",
      );
    }

    console.log("Public markets schema applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Public markets schema sync failed:", error);
  process.exit(1);
});
