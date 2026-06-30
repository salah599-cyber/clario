"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addProposalComment } from "@/lib/actions/proposals";
import { PROPOSAL_COMMENT_KIND_LABELS } from "@/lib/labels";
import { formatUserName } from "@/lib/proposals/users";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CommentRow = {
  id: string;
  body: string;
  kind: string;
  createdAt: Date | string;
  author: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
};

export function ProposalCommentThread({
  proposalId,
  comments,
  canComment,
}: {
  proposalId: string;
  comments: CommentRow[];
  canComment: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await addProposalComment(proposalId, body);
        setBody("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add comment.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{formatUserName(comment.author)}</span>
                  <Badge variant="outline">{PROPOSAL_COMMENT_KIND_LABELS[comment.kind] ?? comment.kind}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap">{comment.body}</p>
              </li>
            ))}
          </ul>
        )}

        {canComment ? (
          <form onSubmit={handleSubmit} className="space-y-2 border-t pt-4">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Add a note..."
              required
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Posting..." : "Add Note"}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
