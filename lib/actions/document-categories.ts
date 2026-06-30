"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit/log";
import { createDocumentCategory } from "@/lib/data/document-categories";
import { canWrite, requireModuleAccess } from "@/lib/permissions/access";

export async function addDocumentCategory(name: string) {
  const ctx = await requireModuleAccess("DOCUMENTS");
  if (!canWrite(ctx, "DOCUMENTS")) {
    throw new Error("You do not have permission to add document categories.");
  }

  const category = await createDocumentCategory(name);

  await logAudit({
    userId: ctx.id,
    action: "CREATE",
    resource: "DocumentCategoryRecord",
    resourceId: category.id,
    metadata: { name: category.name },
  });

  revalidatePath("/documents");
  revalidatePath("/admin/users");
  return { id: category.id, name: category.name };
}
