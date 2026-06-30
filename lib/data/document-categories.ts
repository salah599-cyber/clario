import { db } from "@/lib/db";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/labels";

const LEGACY_ENUM_TO_NAME: Record<string, string> = {
  KYC: "KYC",
  LEGAL: "Legal",
  PROPERTY: "Property",
  CORPORATE: "Corporate",
  TAX: "Tax",
  BANKING: "Banking",
  OTHER: "Other",
};

export const DEFAULT_DOCUMENT_CATEGORY_NAMES = Object.values(DOCUMENT_CATEGORY_LABELS);

export async function ensureDefaultDocumentCategories() {
  const count = await db.documentCategoryRecord.count();
  if (count > 0) return;

  await db.documentCategoryRecord.createMany({
    data: DEFAULT_DOCUMENT_CATEGORY_NAMES.map((name, index) => ({
      name,
      sortOrder: index,
      isActive: true,
      isSystem: true,
    })),
    skipDuplicates: true,
  });
}

async function findCategoryByName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  return db.documentCategoryRecord.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
  });
}

export async function resolveDocumentCategoryId(value: string) {
  await ensureDefaultDocumentCategories();
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Category is required.");

  const byId = await db.documentCategoryRecord.findFirst({
    where: { id: trimmed, isActive: true },
  });
  if (byId) return byId;

  const displayName = LEGACY_ENUM_TO_NAME[trimmed] ?? trimmed;
  const byName = await findCategoryByName(displayName);
  if (byName) {
    if (!byName.isActive) {
      return db.documentCategoryRecord.update({
        where: { id: byName.id },
        data: { isActive: true },
      });
    }
    return byName;
  }

  throw new Error("Document category not found.");
}

export async function resolveDocumentCategoryIds(values: string[]) {
  await ensureDefaultDocumentCategories();
  const ids: string[] = [];

  for (const value of values) {
    const category = await resolveDocumentCategoryId(value);
    if (!ids.includes(category.id)) ids.push(category.id);
  }

  return ids;
}

export async function listDocumentCategories() {
  await ensureDefaultDocumentCategories();
  return db.documentCategoryRecord.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, isSystem: true },
  });
}

export async function createDocumentCategory(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name is required.");

  await ensureDefaultDocumentCategories();

  const existing = await findCategoryByName(trimmed);
  if (existing) {
    if (!existing.isActive) {
      return db.documentCategoryRecord.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    }
    return existing;
  }

  const maxOrder = await db.documentCategoryRecord.aggregate({ _max: { sortOrder: true } });
  return db.documentCategoryRecord.create({
    data: {
      name: trimmed,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
}
