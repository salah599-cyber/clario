"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { deleteBlobUrl } from "@/lib/blob";
import { logAudit } from "@/lib/audit/log";
import { canWrite, requireModuleAccess } from "@/lib/permissions/access";
import { chequeEntityFilter } from "@/lib/permissions/scoped-queries";
import type {
  ChequeDirection,
  ChequeDocumentType,
  ChequeStatus,
} from "@/lib/generated/prisma/client";

function parseDate(value?: string | null) {
  if (!value || value.trim() === "") return undefined;
  return new Date(value);
}

function parseDecimal(value?: string | null) {
  if (!value || value.trim() === "") return undefined;
  return value.trim();
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getFilesFromFormData(formData: FormData, field: string): File[] {
  return formData
    .getAll(field)
    .filter((item): item is File => item instanceof File && item.size > 0);
}

function assertEntityAccess(
  ctx: Awaited<ReturnType<typeof requireModuleAccess>>,
  entityId: string,
) {
  if (ctx.entityIds.length > 0 && !ctx.entityIds.includes(entityId)) {
    if (ctx.role !== "PRINCIPAL" && !ctx.isSuperAdmin) {
      throw new Error("You do not have access to this entity.");
    }
  }
}

function readChequeFormData(formData: FormData) {
  const direction = String(formData.get("direction") ?? "ISSUED") as ChequeDirection;
  const status = String(formData.get("status") ?? "PENDING") as ChequeStatus;
  const chequeNumber = String(formData.get("chequeNumber") ?? "").trim();
  const entityId = String(formData.get("entityId") ?? "").trim();
  const amount = parseDecimal(String(formData.get("amount") ?? ""));
  const bankAccountIdRaw = String(formData.get("bankAccountId") ?? "").trim();
  const issueDateRaw = String(formData.get("issueDate") ?? "").trim();

  if (!chequeNumber) throw new Error("Cheque number is required.");
  if (!entityId) throw new Error("Entity is required.");
  if (!amount) throw new Error("Amount is required.");
  if (!issueDateRaw) throw new Error("Issue date is required.");

  const payee = String(formData.get("payee") ?? "").trim();
  if (!payee) throw new Error("Payee / payer name is required.");

  const issueDate = parseDate(issueDateRaw);
  if (!issueDate) throw new Error("Issue date is invalid.");

  const clearanceDate = parseDate(String(formData.get("clearanceDate") ?? ""));
  if (status === "CLEARED" && !clearanceDate) {
    throw new Error("Clearance date is required when status is Cleared.");
  }

  return {
    direction,
    status,
    chequeNumber,
    entityId,
    amount,
    currency: String(formData.get("currency") ?? "OMR").trim() || "OMR",
    payee,
    issueDate,
    dueDate: parseDate(String(formData.get("dueDate") ?? "")),
    clearanceDate: status === "CLEARED" ? clearanceDate : clearanceDate ?? null,
    bankName: String(formData.get("bankName") ?? "").trim() || undefined,
    bankAccountId: bankAccountIdRaw && bankAccountIdRaw !== "none" ? bankAccountIdRaw : undefined,
    purpose: String(formData.get("purpose") ?? "").trim() || undefined,
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  };
}

async function uploadChequeFiles(
  chequeId: string,
  files: File[],
  documentType: ChequeDocumentType,
  uploadedById: string,
  labelPrefix?: string,
) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not configured. Document uploads require Vercel Blob storage.",
    );
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!(file instanceof File) || file.size === 0) continue;

    const pathname =
      "cheques/" +
      chequeId +
      "/" +
      documentType.toLowerCase() +
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

    await db.chequeDocument.create({
      data: {
        chequeId,
        documentType,
        label: labelPrefix ? labelPrefix + " " + (i + 1) : file.name,
        fileName: file.name,
        fileUrl: blob.url,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        uploadedById,
      },
    });
  }
}

async function validateBankAccount(
  ctx: Awaited<ReturnType<typeof requireModuleAccess>>,
  bankAccountId: string | undefined,
  entityId: string,
) {
  if (!bankAccountId) return;

  const account = await db.bankAccount.findFirst({
    where: {
      id: bankAccountId,
      OR: [{ entityId }, { entityId: null }],
    },
  });
  if (!account) throw new Error("Bank account not found for this entity.");
  if (account.entityId && account.entityId !== entityId) {
    throw new Error("Bank account does not belong to the selected entity.");
  }
}

export async function createCheque(formData: FormData) {
  const ctx = await requireModuleAccess("CHEQUES");
  if (!canWrite(ctx, "CHEQUES")) {
    throw new Error("You do not have permission to register cheques.");
  }

  const data = readChequeFormData(formData);
  assertEntityAccess(ctx, data.entityId);
  await validateBankAccount(ctx, data.bankAccountId, data.entityId);

  const cheque = await db.cheque.create({
    data: {
      direction: data.direction,
      status: data.status,
      chequeNumber: data.chequeNumber,
      amount: data.amount,
      currency: data.currency,
      payee: data.payee,
      issueDate: data.issueDate,
      dueDate: data.dueDate ?? null,
      clearanceDate: data.clearanceDate ?? null,
      bankName: data.bankName,
      bankAccountId: data.bankAccountId ?? null,
      purpose: data.purpose,
      notes: data.notes,
      entityId: data.entityId,
    },
  });

  const chequeCopyFiles = getFilesFromFormData(formData, "chequeCopyFiles");
  const depositSlipFiles = getFilesFromFormData(formData, "depositSlipFiles");
  const confirmationFiles = getFilesFromFormData(formData, "confirmationFiles");
  const otherFiles = getFilesFromFormData(formData, "otherFiles");

  if (chequeCopyFiles.length) {
    await uploadChequeFiles(cheque.id, chequeCopyFiles, "CHEQUE_COPY", ctx.id);
  }
  if (depositSlipFiles.length) {
    await uploadChequeFiles(cheque.id, depositSlipFiles, "DEPOSIT_SLIP", ctx.id);
  }
  if (confirmationFiles.length) {
    await uploadChequeFiles(cheque.id, confirmationFiles, "BANK_CONFIRMATION", ctx.id);
  }
  if (otherFiles.length) {
    await uploadChequeFiles(cheque.id, otherFiles, "OTHER", ctx.id, "Other document");
  }

  await logAudit({
    userId: ctx.id,
    action: "CREATE",
    resource: "Cheque",
    resourceId: cheque.id,
    metadata: { chequeNumber: cheque.chequeNumber, direction: cheque.direction },
  });

  revalidatePath("/cheques");
  revalidatePath("/dashboard");
  return cheque;
}

export async function updateCheque(id: string, formData: FormData) {
  const ctx = await requireModuleAccess("CHEQUES");
  if (!canWrite(ctx, "CHEQUES")) {
    throw new Error("You do not have permission to update cheques.");
  }

  const existing = await db.cheque.findFirst({
    where: { id, ...chequeEntityFilter(ctx) },
  });
  if (!existing) throw new Error("Cheque not found.");

  const data = readChequeFormData(formData);
  assertEntityAccess(ctx, data.entityId);
  await validateBankAccount(ctx, data.bankAccountId, data.entityId);

  const cheque = await db.cheque.update({
    where: { id },
    data: {
      direction: data.direction,
      status: data.status,
      chequeNumber: data.chequeNumber,
      amount: data.amount,
      currency: data.currency,
      payee: data.payee,
      issueDate: data.issueDate,
      dueDate: data.dueDate ?? null,
      clearanceDate: data.status === "CLEARED" ? data.clearanceDate : data.clearanceDate ?? null,
      bankName: data.bankName,
      bankAccountId: data.bankAccountId ?? null,
      purpose: data.purpose,
      notes: data.notes,
      entityId: data.entityId,
    },
  });

  await logAudit({
    userId: ctx.id,
    action: "UPDATE",
    resource: "Cheque",
    resourceId: id,
    metadata: { chequeNumber: cheque.chequeNumber },
  });

  revalidatePath("/cheques");
  revalidatePath("/cheques/" + id);
  revalidatePath("/cheques/" + id + "/edit");
  revalidatePath("/dashboard");
  return cheque;
}

export async function uploadChequeDocuments(formData: FormData) {
  const ctx = await requireModuleAccess("CHEQUES");
  if (!canWrite(ctx, "CHEQUES")) {
    throw new Error("You do not have permission to upload cheque documents.");
  }

  const chequeId = String(formData.get("chequeId") ?? "").trim();
  const documentType = String(formData.get("documentType") ?? "") as ChequeDocumentType;
  if (!chequeId) throw new Error("Cheque is required.");
  if (!documentType) throw new Error("Document type is required.");

  const cheque = await db.cheque.findFirst({
    where: { id: chequeId, ...chequeEntityFilter(ctx) },
  });
  if (!cheque) throw new Error("Cheque not found.");

  const field =
    documentType === "CHEQUE_COPY"
      ? "chequeCopyFiles"
      : documentType === "DEPOSIT_SLIP"
        ? "depositSlipFiles"
        : documentType === "BANK_CONFIRMATION"
          ? "confirmationFiles"
          : "otherFiles";

  const files = getFilesFromFormData(formData, field);
  if (files.length === 0) throw new Error("At least one file is required.");

  await uploadChequeFiles(
    chequeId,
    files,
    documentType,
    ctx.id,
    documentType === "OTHER" ? "Other document" : undefined,
  );

  await logAudit({
    userId: ctx.id,
    action: "UPLOAD",
    resource: "ChequeDocument",
    resourceId: chequeId,
    metadata: { documentType, count: files.length },
  });

  revalidatePath("/cheques/" + chequeId);
  revalidatePath("/cheques");
}

export async function listCheques() {
  const ctx = await requireModuleAccess("CHEQUES");
  return db.cheque.findMany({
    where: chequeEntityFilter(ctx),
    include: {
      entity: true,
      bankAccount: { select: { id: true, accountName: true, bankName: true } },
      documents: { select: { id: true, documentType: true } },
    },
    orderBy: [{ issueDate: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getCheque(id: string) {
  const ctx = await requireModuleAccess("CHEQUES");
  return db.cheque.findFirst({
    where: { id, ...chequeEntityFilter(ctx) },
    include: {
      entity: true,
      bankAccount: true,
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function listChequeBankAccountOptions() {
  const ctx = await requireModuleAccess("CHEQUES");
  const filter = chequeEntityFilter(ctx);
  const where =
    "entityId" in filter && filter.entityId && typeof filter.entityId === "object"
      ? { OR: [{ entityId: filter.entityId }, { entityId: null }] }
      : {};

  return db.bankAccount.findMany({
    where,
    select: {
      id: true,
      accountName: true,
      bankName: true,
      accountNumber: true,
      entityId: true,
      currency: true,
    },
    orderBy: [{ bankName: "asc" }, { accountName: "asc" }],
  });
}

export async function deleteChequeDocument(id: string) {
  const ctx = await requireModuleAccess("CHEQUES");
  if (!canWrite(ctx, "CHEQUES")) {
    throw new Error("You do not have permission to delete cheque documents.");
  }

  const document = await db.chequeDocument.findFirst({
    where: { id, cheque: chequeEntityFilter(ctx) },
  });
  if (!document) throw new Error("Document not found.");

  await deleteBlobUrl(document.fileUrl);
  await db.chequeDocument.delete({ where: { id } });

  await logAudit({
    userId: ctx.id,
    action: "DELETE",
    resource: "ChequeDocument",
    resourceId: id,
    metadata: { chequeId: document.chequeId },
  });

  revalidatePath("/cheques/" + document.chequeId);
  revalidatePath("/cheques");
}

export async function deleteCheque(id: string) {
  const ctx = await requireModuleAccess("CHEQUES");
  if (!canWrite(ctx, "CHEQUES")) {
    throw new Error("You do not have permission to remove cheques.");
  }

  const cheque = await db.cheque.findFirst({
    where: { id, ...chequeEntityFilter(ctx) },
  });
  if (!cheque) throw new Error("Cheque not found.");

  await db.cheque.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await logAudit({
    userId: ctx.id,
    action: "DELETE",
    resource: "Cheque",
    resourceId: id,
    metadata: { chequeNumber: cheque.chequeNumber, softDelete: true },
  });

  revalidatePath("/cheques");
  revalidatePath("/dashboard");
}
