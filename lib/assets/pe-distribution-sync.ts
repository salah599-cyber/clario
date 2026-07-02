import { db } from "@/lib/db";
import type {
  AssetDistributionType,
  PeDistribution,
  PeDistributionType,
} from "@/lib/generated/prisma/client";

function mapPeTypeToAssetType(type: PeDistributionType): AssetDistributionType {
  switch (type) {
    case "DIVIDEND":
      return "DIVIDEND";
    case "RETURN_OF_CAPITAL":
      return "RETURN_OF_CAPITAL";
    case "EXIT_PROCEEDS":
      return "EXIT_PROCEEDS";
    case "INTEREST":
      return "INTEREST";
    default:
      return "DISTRIBUTION";
  }
}

export async function mirrorPeDistributionToAsset(
  peDistribution: PeDistribution,
  assetId: string,
  currency: string,
) {
  const data = {
    assetId,
    distributionDate: peDistribution.distributionDate,
    amount: peDistribution.amountReporting.toString(),
    currency,
    distributionType: mapPeTypeToAssetType(peDistribution.distributionType),
    source: "PRIVATE_EQUITY" as const,
    notes: peDistribution.notes,
    peDistributionId: peDistribution.id,
  };

  await db.assetDistribution.upsert({
    where: { peDistributionId: peDistribution.id },
    create: data,
    update: {
      distributionDate: data.distributionDate,
      amount: data.amount,
      currency: data.currency,
      distributionType: data.distributionType,
      notes: data.notes,
      source: "PRIVATE_EQUITY",
    },
  });
}

export async function deleteMirroredPeDistribution(peDistributionId: string) {
  await db.assetDistribution.deleteMany({ where: { peDistributionId } });
}

export async function syncAllPeDistributionsForCompany(companyId: string) {
  const company = await db.peCompany.findUnique({
    where: { id: companyId },
    include: { distributions: true },
  });
  if (!company?.assetId) return;

  for (const distribution of company.distributions) {
    await mirrorPeDistributionToAsset(
      distribution,
      company.assetId,
      company.reportingCurrency,
    );
  }
}

export async function mirrorPeDistributionById(peDistributionId: string) {
  const distribution = await db.peDistribution.findUnique({
    where: { id: peDistributionId },
    include: { company: { select: { assetId: true, reportingCurrency: true } } },
  });
  if (!distribution?.company.assetId) return;
  await mirrorPeDistributionToAsset(
    distribution,
    distribution.company.assetId,
    distribution.company.reportingCurrency,
  );
}
