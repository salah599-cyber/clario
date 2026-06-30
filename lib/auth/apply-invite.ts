import { db } from "@/lib/db";
import { resolveDocumentCategoryIds } from "@/lib/data/document-categories";
import type { ModuleName, PermissionLevel, UserRole } from "@/lib/generated/prisma/client";

type InviteConfig = {
  role: UserRole;
  isSuperAdmin: boolean;
  entityIds: string[];
  moduleOverrides: Partial<Record<ModuleName, PermissionLevel>>;
  documentCategories: string[];
};

function parseInviteConfig(invite: {
  role: UserRole;
  isSuperAdmin: boolean;
  entityIds: unknown;
  moduleOverrides: unknown;
  documentCategories: unknown;
}): InviteConfig {
  return {
    role: invite.role,
    isSuperAdmin: invite.isSuperAdmin,
    entityIds: Array.isArray(invite.entityIds) ? (invite.entityIds as string[]) : [],
    moduleOverrides:
      invite.moduleOverrides && typeof invite.moduleOverrides === "object"
        ? (invite.moduleOverrides as Partial<Record<ModuleName, PermissionLevel>>)
        : {},
    documentCategories: Array.isArray(invite.documentCategories)
      ? (invite.documentCategories as string[])
      : [],
  };
}

async function scopeRows(userId: string, categoryIds: string[]) {
  return categoryIds.map((categoryId) => ({ userId, categoryId }));
}

export async function applyPendingInvite(userId: string, email: string) {
  const pending = await db.pendingUserInvite.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!pending || pending.acceptedAt) return null;

  const config = parseInviteConfig(pending);
  const categoryIds = await resolveDocumentCategoryIds(config.documentCategories);

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        role: config.role,
        isSuperAdmin: config.isSuperAdmin,
      },
    });

    await tx.userEntityAccess.deleteMany({ where: { userId } });
    if (config.entityIds.length > 0) {
      await tx.userEntityAccess.createMany({
        data: config.entityIds.map((entityId) => ({ userId, entityId })),
      });
    }

    await tx.userPermissionOverride.deleteMany({ where: { userId } });
    const overrideEntries = Object.entries(config.moduleOverrides).filter(
      ([, level]) => level && level !== "NONE",
    );
    if (overrideEntries.length > 0) {
      await tx.userPermissionOverride.createMany({
        data: overrideEntries.map(([module, level]) => ({
          userId,
          module: module as ModuleName,
          level: level as PermissionLevel,
        })),
      });
    }

    await tx.userDocumentScope.deleteMany({ where: { userId } });
    if (categoryIds.length > 0) {
      await tx.userDocumentScope.createMany({
        data: await scopeRows(userId, categoryIds),
      });
    }

    await tx.pendingUserInvite.update({
      where: { id: pending.id },
      data: { acceptedAt: new Date() },
    });
  });

  return config;
}

export async function applyUserAccess(
  userId: string,
  config: InviteConfig,
) {
  const categoryIds = await resolveDocumentCategoryIds(config.documentCategories);

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        role: config.role,
        isSuperAdmin: config.isSuperAdmin,
      },
    });

    await tx.userEntityAccess.deleteMany({ where: { userId } });
    if (config.entityIds.length > 0) {
      await tx.userEntityAccess.createMany({
        data: config.entityIds.map((entityId) => ({ userId, entityId })),
      });
    }

    await tx.userPermissionOverride.deleteMany({ where: { userId } });
    const overrideEntries = Object.entries(config.moduleOverrides).filter(
      ([, level]) => level && level !== "NONE",
    );
    if (overrideEntries.length > 0) {
      await tx.userPermissionOverride.createMany({
        data: overrideEntries.map(([module, level]) => ({
          userId,
          module: module as ModuleName,
          level: level as PermissionLevel,
        })),
      });
    }

    await tx.userDocumentScope.deleteMany({ where: { userId } });
    if (categoryIds.length > 0) {
      await tx.userDocumentScope.createMany({
        data: await scopeRows(userId, categoryIds),
      });
    }
  });
}

export type { InviteConfig };
