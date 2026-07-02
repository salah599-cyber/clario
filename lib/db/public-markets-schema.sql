-- Public Markets schema extensions (idempotent ALTERs for existing deployments)

DO $$ BEGIN
  CREATE TYPE "PublicMarket" AS ENUM (
    'MSX',
    'USA',
    'HONG_KONG',
    'CHINA',
    'INDIA',
    'UK',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PublicHoldingSource" AS ENUM ('IMPORT', 'MANUAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "PublicEquityHolding" ADD COLUMN IF NOT EXISTS "market" "PublicMarket" NOT NULL DEFAULT 'MSX';
ALTER TABLE "PublicEquityHolding" ADD COLUMN IF NOT EXISTS "exchange" TEXT;
ALTER TABLE "PublicEquityHolding" ADD COLUMN IF NOT EXISTS "isin" TEXT;
ALTER TABLE "PublicEquityHolding" ADD COLUMN IF NOT EXISTS "cusip" TEXT;
ALTER TABLE "PublicEquityHolding" ADD COLUMN IF NOT EXISTS "sedol" TEXT;
ALTER TABLE "PublicEquityHolding" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "PublicEquityHolding" ADD COLUMN IF NOT EXISTS "source" "PublicHoldingSource" NOT NULL DEFAULT 'IMPORT';

ALTER TABLE "ImportBatch" ADD COLUMN IF NOT EXISTS "market" "PublicMarket";
ALTER TABLE "ImportBatch" ADD COLUMN IF NOT EXISTS "broker" TEXT;
ALTER TABLE "ImportBatch" ADD COLUMN IF NOT EXISTS "accountNumber" TEXT;
ALTER TABLE "ImportBatch" ADD COLUMN IF NOT EXISTS "asOfDate" TIMESTAMP(3);
ALTER TABLE "ImportBatch" ADD COLUMN IF NOT EXISTS "parserId" TEXT;

UPDATE "PublicEquityHolding"
SET "market" = 'MSX'
WHERE "market" IS NULL;

UPDATE "PublicEquityHolding"
SET "source" = 'IMPORT'
WHERE "source" IS NULL;

CREATE INDEX IF NOT EXISTS "PublicEquityHolding_assetId_market_idx"
  ON "PublicEquityHolding" ("assetId", "market");

CREATE INDEX IF NOT EXISTS "PublicEquityHolding_market_idx"
  ON "PublicEquityHolding" ("market");
