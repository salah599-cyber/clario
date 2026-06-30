import type { ProposalDecision } from "@/lib/generated/prisma/client";

export function majorityThreshold(approverCount: number) {
  return Math.floor(approverCount / 2) + 1;
}

export function evaluateMajorityOutcome(
  decisions: { decision: ProposalDecision | string | null }[],
): "APPROVED" | "REJECTED" | "PENDING" {
  const total = decisions.length;
  if (total === 0) return "PENDING";

  const threshold = majorityThreshold(total);
  const approveCount = decisions.filter((d) => d.decision === "APPROVED").length;
  const rejectCount = decisions.filter((d) => d.decision === "REJECTED").length;

  if (approveCount >= threshold) return "APPROVED";
  if (rejectCount >= threshold) return "REJECTED";
  return "PENDING";
}

export function formatApproverProgress(
  decisions: { decision: ProposalDecision | string | null }[],
): string {
  const total = decisions.length;
  const approveCount = decisions.filter((d) => d.decision === "APPROVED").length;
  const rejectCount = decisions.filter((d) => d.decision === "REJECTED").length;
  const pendingCount = decisions.filter((d) => !d.decision).length;
  const threshold = majorityThreshold(total);

  return `${approveCount}/${total} approved · ${rejectCount} rejected · ${pendingCount} pending (need ${threshold})`;
}
