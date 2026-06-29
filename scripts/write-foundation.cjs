const fs = require("fs");
const path = require("path");
const root = process.cwd();
const w = (p, c) => {
  const f = path.join(root, p);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, c, "utf8");
};

w("lib/db.ts", `import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
`);

w("lib/permissions/types.ts", `export type ModuleName =
  | "DASHBOARD"
  | "ASSETS"
  | "DOCUMENTS"
  | "EXPENSES"
  | "REPORTS"
  | "USERS"
  | "AUDIT";

export type PermissionLevel = "FULL" | "READ" | "FILTERED" | "NONE" | "SHARED_ONLY";

export type UserRole =
  | "PRINCIPAL"
  | "SIGNATORY"
  | "FINANCE"
  | "DIRECTOR"
  | "EXTERNAL";

export interface UserContext {
  id: string;
  clerkId: string;
  email: string;
  role: UserRole;
  entityIds: string[];
  documentCategories: string[];
  overrides: Partial<Record<ModuleName, PermissionLevel>>;
}
`);

w("lib/permissions/matrix.ts", `import type { ModuleName, PermissionLevel, UserRole } from "./types";

export const ROLE_MATRIX: Record<UserRole, Record<ModuleName, PermissionLevel>> = {
  PRINCIPAL: {
    DASHBOARD: "FULL",
    ASSETS: "FULL",
    DOCUMENTS: "FULL",
    EXPENSES: "FULL",
    REPORTS: "FULL",
    USERS: "FULL",
    AUDIT: "FULL",
  },
  SIGNATORY: {
    DASHBOARD: "FULL",
    ASSETS: "READ",
    DOCUMENTS: "READ",
    EXPENSES: "NONE",
    REPORTS: "READ",
    USERS: "NONE",
    AUDIT: "NONE",
  },
  FINANCE: {
    DASHBOARD: "READ",
    ASSETS: "READ",
    DOCUMENTS: "FILTERED",
    EXPENSES: "FULL",
    REPORTS: "FILTERED",
    USERS: "NONE",
    AUDIT: "NONE",
  },
  DIRECTOR: {
    DASHBOARD: "READ",
    ASSETS: "FILTERED",
    DOCUMENTS: "FILTERED",
    EXPENSES: "NONE",
    REPORTS: "FILTERED",
    USERS: "NONE",
    AUDIT: "NONE",
  },
  EXTERNAL: {
    DASHBOARD: "NONE",
    ASSETS: "NONE",
    DOCUMENTS: "SHARED_ONLY",
    EXPENSES: "NONE",
    REPORTS: "NONE",
    USERS: "NONE",
    AUDIT: "NONE",
  },
};
`);

w("lib/permissions/access.ts", `import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { ROLE_MATRIX } from "./matrix";
import type { ModuleName, PermissionLevel, UserContext } from "./types";

export async function getCurrentUserContext(): Promise<UserContext | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      entityAccess: true,
      documentScopes: true,
      permissionOverrides: true,
    },
  });

  if (!user || !user.isActive) return null;

  const overrides: Partial<Record<ModuleName, PermissionLevel>> = {};
  for (const o of user.permissionOverrides) {
    overrides[o.module as ModuleName] = o.level as PermissionLevel;
  }

  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    role: user.role as UserContext["role"],
    entityIds: user.entityAccess.map((e) => e.entityId),
    documentCategories: user.documentScopes.map((d) => d.category),
    overrides,
  };
}

export function getModulePermission(
  ctx: UserContext,
  module: ModuleName,
): PermissionLevel {
  return ctx.overrides[module] ?? ROLE_MATRIX[ctx.role][module];
}

export function canAccess(ctx: UserContext, module: ModuleName): boolean {
  const level = getModulePermission(ctx, module);
  return level !== "NONE";
}

export function canWrite(ctx: UserContext, module: ModuleName): boolean {
  return getModulePermission(ctx, module) === "FULL";
}

export async function requireUserContext(): Promise<UserContext> {
  const ctx = await getCurrentUserContext();
  if (!ctx) throw new Error("Unauthorized");
  return ctx;
}

export async function requireModuleAccess(module: ModuleName): Promise<UserContext> {
  const ctx = await requireUserContext();
  if (!canAccess(ctx, module)) throw new Error("Forbidden");
  return ctx;
}
`);

w("lib/permissions/scoped-queries.ts", `import type { UserContext } from "./types";
import { getModulePermission } from "./access";

export function assetEntityFilter(ctx: UserContext) {
  const level = getModulePermission(ctx, "ASSETS");
  if (level === "FULL" || level === "READ") return {};
  if (level === "FILTERED") return { entityId: { in: ctx.entityIds } };
  return { id: "__none__" };
}

export function documentFilter(ctx: UserContext) {
  const level = getModulePermission(ctx, "DOCUMENTS");
  if (level === "FULL" || level === "READ") return {};
  if (level === "FILTERED") return { category: { in: ctx.documentCategories as never[] } };
  if (level === "SHARED_ONLY") return { id: "__none__" };
  return { id: "__none__" };
}

export function expenseEntityFilter(ctx: UserContext) {
  const level = getModulePermission(ctx, "EXPENSES");
  if (level === "FULL") return {};
  return { id: "__none__" };
}
`);

w("lib/audit/log.ts", `import { db } from "@/lib/db";

export async function logAudit(input: {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  await db.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      metadata: input.metadata ?? undefined,
      ipAddress: input.ipAddress,
    },
  });
}
`);

w("lib/auth/sync-user.ts", `import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import type { UserRole } from "@/lib/permissions/types";

export async function syncClerkUser(defaultRole: UserRole = "EXTERNAL") {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  return db.user.upsert({
    where: { clerkId: clerkUser.id },
    create: {
      clerkId: clerkUser.id,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      role: defaultRole,
    },
    update: {
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
    },
  });
}
`);

console.log("batch 1 written");