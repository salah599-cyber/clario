import type { AssetDistribution } from "@/lib/generated/prisma/client";

function toNumber(value: { toString(): string } | number | null | undefined) {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : parseFloat(value.toString());
  return Number.isNaN(n) ? 0 : n;
}

function ytdStart() {
  const now = new Date();
  return new Date(now.getFullYear(), 0, 1);
}

export type AssetDistributionMetrics = {
  totalDistributed: number;
  distributedYtd: number;
  lastDistributionDate: Date | null;
  dpiPct: number | null;
  byType: Record<string, number>;
};

export function computeAssetDistributionMetrics(
  distributions: Pick<AssetDistribution, "distributionDate" | "amount" | "distributionType">[],
  acquisitionCost: { toString(): string } | number | null | undefined,
): AssetDistributionMetrics {
  const ytd = ytdStart();
  let totalDistributed = 0;
  let distributedYtd = 0;
  let lastDistributionDate: Date | null = null;
  const byType: Record<string, number> = {};

  for (const row of distributions) {
    const amount = toNumber(row.amount);
    totalDistributed += amount;
    if (row.distributionDate >= ytd) {
      distributedYtd += amount;
    }
    if (!lastDistributionDate || row.distributionDate > lastDistributionDate) {
      lastDistributionDate = row.distributionDate;
    }
    byType[row.distributionType] = (byType[row.distributionType] ?? 0) + amount;
  }

  const cost = toNumber(acquisitionCost);
  const dpiPct = cost > 0 ? (totalDistributed / cost) * 100 : null;

  return {
    totalDistributed,
    distributedYtd,
    lastDistributionDate,
    dpiPct,
    byType,
  };
}
