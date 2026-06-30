import { PROPOSAL_STATUS_LABELS } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";

const VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  PENDING: "default",
  RETURNED: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
};

export function ProposalStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={VARIANTS[status] ?? "secondary"}>
      {PROPOSAL_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
