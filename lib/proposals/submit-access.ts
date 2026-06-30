import { canAccess } from "@/lib/permissions/access";
import type { UserContext } from "@/lib/permissions/types";

export function canSubmitProposal(ctx: UserContext) {
  if (!canAccess(ctx, "PROPOSALS")) return false;
  return ctx.isSuperAdmin || ctx.role === "PRINCIPAL" || ctx.role === "DIRECTOR";
}
