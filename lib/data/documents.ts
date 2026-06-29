import { db } from "@/lib/db";
import { documentFilter } from "@/lib/permissions/scoped-queries";
import type { UserContext } from "@/lib/permissions/types";

export async function listDocuments(ctx: UserContext) {
  return db.document.findMany({
    where: documentFilter(ctx),
    include: { entity: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getDocumentById(ctx: UserContext, id: string) {
  return db.document.findFirst({
    where: { id, ...documentFilter(ctx) },
    include: { entity: true },
  });
}
