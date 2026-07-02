CREATE TYPE "AssetDistributionType" AS ENUM ('DIVIDEND', 'DISTRIBUTION', 'RETURN_OF_CAPITAL', 'INTEREST', 'COUPON', 'RENT', 'EXIT_PROCEEDS', 'OTHER');
CREATE TYPE "AssetDistributionSource" AS ENUM ('MANUAL', 'PRIVATE_EQUITY');

CREATE TABLE "AssetDistribution" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "distributionDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'OMR',
    "netAmount" DECIMAL(18,2),
    "taxWithheld" DECIMAL(18,2),
    "distributionType" "AssetDistributionType" NOT NULL DEFAULT 'DISTRIBUTION',
    "source" "AssetDistributionSource" NOT NULL DEFAULT 'MANUAL',
    "bankReference" TEXT,
    "notes" TEXT,
    "peDistributionId" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AssetDistribution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssetDistribution_peDistributionId_key" ON "AssetDistribution"("peDistributionId");
CREATE INDEX "AssetDistribution_assetId_distributionDate_idx" ON "AssetDistribution"("assetId", "distributionDate");
CREATE INDEX "AssetDistribution_assetId_distributionType_idx" ON "AssetDistribution"("assetId", "distributionType");

CREATE TABLE "AssetDistributionDocument" (
    "id" TEXT NOT NULL,
    "assetDistributionId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssetDistributionDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AssetDistributionDocument_assetDistributionId_idx" ON "AssetDistributionDocument"("assetDistributionId");

ALTER TABLE "AssetDistribution" ADD CONSTRAINT "AssetDistribution_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetDistribution" ADD CONSTRAINT "AssetDistribution_peDistributionId_fkey" FOREIGN KEY ("peDistributionId") REFERENCES "PeDistribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssetDistributionDocument" ADD CONSTRAINT "AssetDistributionDocument_assetDistributionId_fkey" FOREIGN KEY ("assetDistributionId") REFERENCES "AssetDistribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
