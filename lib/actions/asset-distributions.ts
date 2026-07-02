"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { deleteBlobUrl } from "@/lib/blob";
import { logAudit } from "@/lib/audit/log";
import { ensureAssetDistributionSchema } from "@/lib/db/ensure-asset-distribution-schema";
import { syncAllPeDistributionsForCompany } from "@/lib/assets/pe-distribution-sync";
import { canWrite, requireModuleAccess } from "@/lib/permissions/access";
import { assetEntityFilter } from "@/lib/permissions/scoped-queries";
import type { AssetDistributionType } from "@/lib/generated/prisma/client";

function parseDecimal(value?: string | null) {
  if (!value || value.trim() === "") return undefined;
  return value.trim();
}

function parseDate(value?: string | null) {
  if (!value || value.trim() === "") return undefined;
  return new Date(value);
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getFilesFromFormData(formData: FormData, field: string): File[] {
  return formData
    .getAll(field)
    .filter((item): item is File => item instanceof File && item.size > 0);
}

async function getWritableAsset(assetId: string) {
  const ctx = await requireModuleAccess("ASSETS");
  if (!canWrite(ctx, "ASSETS")) {
    throw new Error("You do not have permission to update assets.");
  }

  await ensureAssetDistributionSchema();

  const asset = await db.asset.findFirst({
    where: { id: assetId, ...assetEntityFilter(ctx) },
    include: { peCompany: { select: { id: true } } },
  });
  if (!asset) throw new Error("Asset not found.");
  return { ctx, asset };
}

async function getReadableAsset(assetId: string) {
  const ctx = await requireModuleAccess("ASSETS");
  await ensureAssetDistributionSchema();
  const asset = await db.asset.findFirst({
    where: { id: assetId, ...assetEntityFilter(ctx) },
    include: { peCompany: { select: { id: true, name: true } } },
  });
  if (!asset) throw new Error("Asset not found.");
  return { ctx, asset };
}

function revalidateAsset(assetId: string) {
  revalidatePath("/assets");
  revalidatePath("/assets/" + assetId);
  revalidatePath("/dashboard");
}

export async function upsertAssetDistribution(assetId: string, formData: FormData) {
  const { ctx, asset } = await getWritableAsset(assetId);
  if (asset.peCompany) {
    throw new Error(
      "This asset is linked to a PE / VC company. Record distributions from the PE portfolio instead.",
    );
  }

  const id = String(formData.get("id") ?? "").trim();
  const distributionDate = parseDate(String(formData.get("distributionDate") ?? ""));
  const amount = parseDecimal(String(formData.get("amount") ?? ""));
  if (!distributionDate) throw new Error("Distribution date is required.");
  if (!amount) throw new Error("Amount is required.");

  const data = {
    assetId,
    distributionDate,
    amount,
    currency: String(formData.get("currency") ?? asset.currency).trim() || asset.currency,
    netAmount: parseDecimal(String(formData.get("netAmount") ?? "")),
    taxWithheld: parseDecimal(String(formData.get("taxWithheld") ?? "")),
    distributionType: String(formData.get("distributionType") ?? "DISTRIBUTION") as AssetDistributionType,
    bankReference: String(formData.get("bankReference") ?? "").trim() || undefined,
    notes: String(formData.get("notes") ?? "").trim() || undefined,
    source: "MANUAL" as const,
    recordedById: ctx.id,
  };

  const distribution = id
    ? await db.assetDistribution.update({ where: { id, assetId }, data })
    : await db.assetDistribution.create({ data });

  const files = getFilesFromFormData(formData, "files");
  if (files.length > 0) {
    await uploadDistributionDocuments(distribution.id, assetId, files, ctx.id);
  }

  await logAudit({
    userId: ctx.id,
    action: id ? "UPDATE" : "CREATE",
    resource: "AssetDistribution",
    resourceId: distribution.id,
    metadata: { assetId },
  });

  revalidateAsset(assetId);
  return distribution;
}

export async function deleteAssetDistribution(id: string) {
  const ctx = await requireModuleAccess("ASSETS");
  if (!canWrite(ctx, "ASSETS")) {
    throw new Error("You do not have permission to update assets.");
  }

  await ensureAssetDistributionSchema();

  const distribution = await db.assetDistribution.findFirst({
    where: {
      id,
      asset: assetEntityFilter(ctx),
    },
    include: { documents: true, asset: { include: { peCompany: true } } },
  });
  if (!distribution) throw new Error("Distribution not found.");
  if (distribution.peDistributionId || distribution.source === "PRIVATE_EQUITY") {
    throw new Error("PE-linked distributions must be deleted from the PE / VC portfolio.");
  }

  for (const doc of distribution.documents) {
    await deleteBlobUrl(doc.fileUrl);
  }

  await db.assetDistribution.delete({ where: { id } });

  await logAudit({
    userId: ctx.id,
    action: "DELETE",
    resource: "AssetDistribution",
    resourceId: id,
    metadata: { assetId: distribution.assetId },
  });

  revalidateAsset(distribution.assetId);
}

async function uploadDistributionDocuments(
  distributionId: string,
  assetId: string,
  files: File[],
  uploadedById: string,
) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not configured. Document uploads require Vercel Blob storage.",
    );
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const pathname =
      "assets/" +
      assetId +
      "/distributions/" +
      distributionId +
      "/" +
      Date.now() +
      "-" +
      i +
      "-" +
      sanitizeFileName(file.name);

    const blob = await put(pathname, file, {
      access: "public",
      token,
      contentType: file.type || undefined,
    });

    await db.assetDistributionDocument.create({
      data: {
        assetDistributionId: distributionId,
        fileName: file.name,
        fileUrl: blob.url,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        uploadedById,
      },
    });
  }
}

export async function deleteAssetDistributionDocument(documentId: string) {
  const ctx = await requireModuleAccess("ASSETS");
  if (!canWrite(ctx, "ASSETS")) {
    throw new Error("You do not have permission to update assets.");
  }

  await ensureAssetDistributionSchema();

  const document = await db.assetDistributionDocument.findFirst({
    where: {
      id: documentId,
      assetDistribution: { asset: assetEntityFilter(ctx) },
    },
    include: { assetDistribution: true },
  });
  if (!document) throw new Error("Document not found.");

  await deleteBlobUrl(document.fileUrl);
  await db.assetDistributionDocument.delete({ where: { id: documentId } });

  revalidateAsset(document.assetDistribution.assetId);
}

export async function ensureAssetDistributionsReady(assetId: string) {
  const { asset } = await getReadableAsset(assetId);
  if (asset.peCompany) {
    await syncAllPeDistributionsForCompany(asset.peCompany.id);
  }
}
