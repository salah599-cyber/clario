"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit/log";
import { canWrite, requireUserContext } from "@/lib/permissions/access";
import type { ModuleName } from "@/lib/permissions/types";

const ENTITY_WRITE_MODULES: ModuleName[] = [
  "ASSETS",
  "LANDS",
  "CARS",
  "COMPANIES",
  "LOANS",
  "EXPENSES",
  "DOCUMENTS",
];

function canCreateEntity(ctx: Awaited<ReturnType<typeof requireUserContext>>) {
  if (ctx.isSuperAdmin || ctx.role === "PRINCIPAL") return true;
  return ENTITY_WRITE_MODULES.some((module) => canWrite(ctx, module));
}

export async function createEntity(name: string, description?: string) {
  const ctx = await requireUserContext();
  if (!canCreateEntity(ctx)) {
    throw new Error("You do not have permission to create entities.");
  }

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Entity name is required.");

  const existing = await db.entity.findUnique({ where: { name: trimmedName } });
  if (existing) {
    return { id: existing.id, name: existing.name };
  }

  const entity = await db.entity.create({
    data: {
      name: trimmedName,
      description: description?.trim() || undefined,
    },
  });

  if (
    !ctx.isSuperAdmin &&
    ctx.role !== "PRINCIPAL" &&
    ctx.entityIds.length > 0
  ) {
    await db.userEntityAccess.upsert({
      where: {
        userId_entityId: { userId: ctx.id, entityId: entity.id },
      },
      create: { userId: ctx.id, entityId: entity.id },
      update: {},
    });
  }

  await logAudit({
    userId: ctx.id,
    action: "CREATE",
    resource: "Entity",
    resourceId: entity.id,
    metadata: { name: entity.name },
  });

  revalidatePath("/", "layout");

  return { id: entity.id, name: entity.name };
}
