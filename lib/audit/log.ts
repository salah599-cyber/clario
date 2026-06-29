import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

export async function logAudit(input: {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
}) {
  await db.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
    },
  });
}