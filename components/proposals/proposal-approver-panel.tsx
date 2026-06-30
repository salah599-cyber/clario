"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordApproverDecision } from "@/lib/actions/proposals";
import { PROPOSAL_DECISION_LABELS } from "@/lib/labels";
import { formatApproverProgress } from "@/lib/proposals/approval";
import { formatUserName } from "@/lib/proposals/users";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ApproverRow = {
  id: string;
  userId: string;
  decision: string | null;
  comment: string | null;
  decidedAt: Date | string | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
  };
};

export function ProposalApproverPanel({
  proposalId,
  status,
  approvers,
  currentUserId,
}: {
  proposalId: string;
  status: string;
  approvers: ApproverRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const myRow = approvers.find((a) => a.userId === currentUserId);
  const canDecide = status === "PENDING" && myRow && !myRow.decision;

  function submitDecision(decision: "APPROVED" | "REJECTED" | "RETURNED") {
    setError(null);
    const formData = new FormData();
    formData.set("proposalId", proposalId);
    formData.set("decision", decision);
    formData.set("comment", comment);

    startTransition(async () => {
      try {
        await recordApproverDecision(formData);
        setComment("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to record decision.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approvers</CardTitle>
        <CardDescription>{formatApproverProgress(approvers)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {approvers.map((row) => (
            <li key={row.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{formatUserName(row.user)}</p>
                  <p className="text-xs text-muted-foreground">{row.user.email}</p>
                </div>
                {row.decision ? (
                  <Badge variant={row.decision === "REJECTED" ? "destructive" : row.decision === "RETURNED" ? "outline" : "default"}>
                    {PROPOSAL_DECISION_LABELS[row.decision] ?? row.decision}
                  </Badge>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </div>
              {row.comment ? <p className="mt-2 text-muted-foreground">{row.comment}</p> : null}
              {row.decidedAt ? (
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(row.decidedAt)}</p>
              ) : null}
            </li>
          ))}
        </ul>

        {canDecide ? (
          <div className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium">Your decision</p>
            <div className="space-y-2">
              <Label htmlFor="approverComment">Comment</Label>
              <Textarea
                id="approverComment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Required for return or reject. Optional for approve."
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={pending} onClick={() => submitDecision("APPROVED")}>
                Approve
              </Button>
              <Button type="button" variant="outline" disabled={pending} onClick={() => submitDecision("RETURNED")}>
                Return with Comments
              </Button>
              <Button type="button" variant="destructive" disabled={pending} onClick={() => submitDecision("REJECTED")}>
                Reject
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
