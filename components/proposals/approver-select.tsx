"use client";

import { Label } from "@/components/ui/label";
import { formatUserName } from "@/lib/proposals/users";
import { USER_ROLE_OPTIONS } from "@/lib/admin/user-options";

export type ApproverOption = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
};

export function ApproverSelect({
  users,
  currentUserId,
  selectedIds,
  onChange,
}: {
  users: ApproverOption[];
  currentUserId: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const roleLabel = Object.fromEntries(USER_ROLE_OPTIONS.map((r) => [r.value, r.label]));
  const candidates = users.filter((u) => u.id !== currentUserId);

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((v) => v !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className="space-y-2 md:col-span-2">
      <Label>Approvers</Label>
      <p className="text-xs text-muted-foreground">
        Select users who must review this proposal. Majority approval is required to approve.
      </p>
      <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No other active users available.</p>
        ) : (
          candidates.map((user) => (
            <label key={user.id} className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1 size-4"
                checked={selectedIds.includes(user.id)}
                onChange={() => toggle(user.id)}
              />
              <span>
                <span className="font-medium">{formatUserName(user)}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {roleLabel[user.role] ?? user.role}
                </span>
              </span>
            </label>
          ))
        )}
      </div>
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="approverIds" value={id} />
      ))}
    </div>
  );
}
