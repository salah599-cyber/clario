import { Client } from "pg";
import { CASH_MANAGEMENT_SCHEMA_STATEMENTS } from "@/lib/db/cash-management-schema-statements";

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

function isIgnorableSchemaError(message: string) {
  return (
    message.includes("already exists") ||
    message.includes("duplicate_object") ||
    message.includes("duplicate key") ||
    message.includes("IF NOT EXISTS")
  );
}

async function tableExists(client: Client, tableName: string) {
  const result = await client.query(
    `SELECT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = $1
    )`,
    [tableName],
  );
  return Boolean(result.rows[0]?.exists);
}

async function applyCashManagementSchema() {
  const connectionString = getDatabaseUrl();
  if (!connectionString) return;

  const client = new Client({ connectionString });
  await client.connect();

  try {
    if (await tableExists(client, "BankBalanceEntry")) {
      return;
    }

    for (const statement of CASH_MANAGEMENT_SCHEMA_STATEMENTS) {
      try {
        await client.query(statement);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (isIgnorableSchemaError(message)) continue;
        throw new Error(`Cash management schema statement failed: ${message}`);
      }
    }

    if (!(await tableExists(client, "BankBalanceEntry"))) {
      throw new Error("Cash management schema sync finished but BankBalanceEntry table is still missing.");
    }
  } finally {
    await client.end();
  }
}

export async function ensureCashManagementSchema() {
  if (!ensurePromise) {
    ensurePromise = applyCashManagementSchema().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }
  return ensurePromise;
}
