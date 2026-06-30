/**
 * One-time migration: enum DocumentCategory -> DocumentCategoryRecord table.
 * Run before `npm run db:push` when upgrading an existing database:
 *   node scripts/migrate-document-categories.cjs
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const { Client } = require("pg");

const DEFAULT_CATEGORIES = [
  { name: "KYC", sortOrder: 0 },
  { name: "Legal", sortOrder: 1 },
  { name: "Property", sortOrder: 2 },
  { name: "Corporate", sortOrder: 3 },
  { name: "Tax", sortOrder: 4 },
  { name: "Banking", sortOrder: 5 },
  { name: "Other", sortOrder: 6 },
];

const LEGACY_ENUM_TO_NAME = {
  KYC: "KYC",
  LEGAL: "Legal",
  PROPERTY: "Property",
  CORPORATE: "Corporate",
  TAX: "Tax",
  BANKING: "Banking",
  OTHER: "Other",
};

async function tableExists(client, tableName) {
  const result = await client.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    )`,
    [tableName],
  );
  return result.rows[0].exists;
}

async function columnExists(client, tableName, columnName) {
  const result = await client.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
    )`,
    [tableName, columnName],
  );
  return result.rows[0].exists;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const hasRecordTable = await tableExists(client, "DocumentCategoryRecord");
    const documentHasEnum = await columnExists(client, "Document", "category");
    const documentHasFk = await columnExists(client, "Document", "categoryId");

    if (hasRecordTable && documentHasFk && !documentHasEnum) {
      console.log("Document categories already migrated.");
      return;
    }

    await client.query("BEGIN");

    if (!hasRecordTable) {
      await client.query(`
        CREATE TABLE "DocumentCategoryRecord" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "isSystem" BOOLEAN NOT NULL DEFAULT false,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "DocumentCategoryRecord_pkey" PRIMARY KEY ("id")
        )
      `);
      await client.query(`
        CREATE UNIQUE INDEX "DocumentCategoryRecord_name_key" ON "DocumentCategoryRecord"("name")
      `);
    }

    const existing = await client.query(`SELECT id, name FROM "DocumentCategoryRecord"`);
    const byName = new Map(existing.rows.map((row) => [row.name.toLowerCase(), row.id]));

    for (const category of DEFAULT_CATEGORIES) {
      if (byName.has(category.name.toLowerCase())) continue;
      const id = `dcat_${category.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${category.sortOrder}`;
      await client.query(
        `INSERT INTO "DocumentCategoryRecord" ("id", "name", "isActive", "isSystem", "sortOrder", "updatedAt")
         VALUES ($1, $2, true, true, $3, CURRENT_TIMESTAMP)`,
        [id, category.name, category.sortOrder],
      );
      byName.set(category.name.toLowerCase(), id);
    }

    const refreshed = await client.query(`SELECT id, name FROM "DocumentCategoryRecord"`);
    const nameToId = new Map(refreshed.rows.map((row) => [row.name.toLowerCase(), row.id]));
    const enumToId = {};
    for (const [enumValue, displayName] of Object.entries(LEGACY_ENUM_TO_NAME)) {
      enumToId[enumValue] = nameToId.get(displayName.toLowerCase());
    }

    if (!documentHasFk) {
      await client.query(`ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "categoryId" TEXT`);
    }

    if (documentHasEnum) {
      for (const [enumValue, categoryId] of Object.entries(enumToId)) {
        if (!categoryId) continue;
        await client.query(`UPDATE "Document" SET "categoryId" = $1 WHERE "category"::text = $2`, [
          categoryId,
          enumValue,
        ]);
      }

      const fallbackId = nameToId.get("other");
      if (fallbackId) {
        await client.query(`UPDATE "Document" SET "categoryId" = $1 WHERE "categoryId" IS NULL`, [
          fallbackId,
        ]);
      }
    }

    const scopeHasEnum = await columnExists(client, "UserDocumentScope", "category");
    const scopeHasFk = await columnExists(client, "UserDocumentScope", "categoryId");

    if (!scopeHasFk) {
      await client.query(`ALTER TABLE "UserDocumentScope" ADD COLUMN IF NOT EXISTS "categoryId" TEXT`);
    }

    if (scopeHasEnum) {
      for (const [enumValue, categoryId] of Object.entries(enumToId)) {
        if (!categoryId) continue;
        await client.query(
          `UPDATE "UserDocumentScope" SET "categoryId" = $1 WHERE "category"::text = $2`,
          [categoryId, enumValue],
        );
      }
      await client.query(`DELETE FROM "UserDocumentScope" WHERE "categoryId" IS NULL`);
    }

    await client.query("COMMIT");
    console.log("Document category data migration completed.");
    console.log("Run `npm run db:push` to finalize schema constraints.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
