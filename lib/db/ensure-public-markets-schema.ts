import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

let ensurePromise: Promise<void> | null = null;

function getDatabaseUrl() {
  return (
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL
  );
}

function splitSqlStatements(sql: string) {
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

function isIgnorableSchemaError(message: string) {
  return (
    message.includes("already exists") ||
    message.includes("duplicate_object") ||
    message.includes("duplicate key") ||
    message.includes("IF NOT EXISTS")
  );
}

async function columnExists(client: Client, tableName: string, columnName: string) {
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

async function applyPublicMarketsSchema() {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error("No database URL is configured for public markets schema sync.");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    if (await columnExists(client, "PublicEquityHolding", "market")) {
      return;
    }

    const sqlPath = path.join(process.cwd(), "lib/db/public-markets-schema.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    const statements = splitSqlStatements(sql);

    for (const statement of statements) {
      try {
        await client.query(statement);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (isIgnorableSchemaError(message)) continue;
        throw new Error(`Public markets schema statement failed: ${message}`);
      }
    }

    if (!(await columnExists(client, "PublicEquityHolding", "market"))) {
      throw new Error(
        "Public markets schema sync finished but PublicEquityHolding.market is still missing.",
      );
    }
  } finally {
    await client.end();
  }
}

export function ensurePublicMarketsSchema() {
  if (!ensurePromise) {
    ensurePromise = applyPublicMarketsSchema().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }

  return ensurePromise;
}
