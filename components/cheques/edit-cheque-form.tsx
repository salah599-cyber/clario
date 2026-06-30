"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCheque } from "@/lib/actions/cheques";
import {
  CHEQUE_DIRECTION_LABELS,
  CHEQUE_STATUS_LABELS,
} from "@/lib/labels";
import { formatDateInput, formatDecimalInput } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntitySelect, type EntityOption } from "@/components/platform/entity-select";

type BankAccountOption = {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  entityId: string | null;
  currency: string;
};

type ChequeRecord = {
  id: string;
  direction: string;
  status: string;
  chequeNumber: string;
  amount: { toString(): string };
  currency: string;
  payee: string;
  issueDate: Date;
  dueDate: Date | null;
  clearanceDate: Date | null;
  bankName: string | null;
  bankAccountId: string | null;
  purpose: string | null;
  notes: string | null;
  entityId: string;
};

export function EditChequeForm({
  cheque,
  entities,
  bankAccounts,
}: {
  cheque: ChequeRecord;
  entities: EntityOption[];
  bankAccounts: BankAccountOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState(cheque.direction);
  const [status, setStatus] = useState(cheque.status);
  const [entityId, setEntityId] = useState(cheque.entityId);
  const [bankAccountId, setBankAccountId] = useState(cheque.bankAccountId ?? "none");
  const [currency, setCurrency] = useState(cheque.currency);

  const entityBankAccounts = useMemo(
    () => bankAccounts.filter((a) => !a.entityId || a.entityId === entityId),
    [bankAccounts, entityId],
  );

  const payeeLabel = direction === "ISSUED" ? "Payee (beneficiary)" : "Payer";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("direction", direction);
    formData.set("status", status);
    formData.set("entityId", entityId);
    formData.set("bankAccountId", bankAccountId);
    formData.set("currency", currency);

    startTransition(async () => {
      try {
        await updateCheque(cheque.id, formData);
        router.push("/cheques/" + cheque.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update cheque.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Cheque #{cheque.chequeNumber}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Direction</Label>
            <Select value={direction} onValueChange={setDirection}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CHEQUE_DIRECTION_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CHEQUE_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chequeNumber">Cheque Number</Label>
            <Input id="chequeNumber" name="chequeNumber" required defaultValue={cheque.chequeNumber} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payee">{payeeLabel}</Label>
            <Input id="payee" name="payee" required defaultValue={cheque.payee} />
          </div>

          <div className="space-y-2">
            <Label>Entity</Label>
            <EntitySelect
              entities={entities}
              value={entityId}
              onValueChange={(v) => { setEntityId(v); setBankAccountId("none"); }}
            />
          </div>

          <div className="space-y-2">
            <Label>Bank Account (optional)</Label>
            <Select value={bankAccountId} onValueChange={setBankAccountId}>
              <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {entityBankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.bankName} · {account.accountName} ({account.accountNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name (if no account linked)</Label>
            <Input id="bankName" name="bankName" defaultValue={cheque.bankName ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" name="amount" required type="number" step="0.001" min="0" defaultValue={formatDecimalInput(cheque.amount)} />
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["OMR", "USD", "EUR", "GBP", "AED"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issueDate">Issue Date</Label>
            <Input id="issueDate" name="issueDate" type="date" required defaultValue={formatDateInput(cheque.issueDate)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (optional)</Label>
            <Input id="dueDate" name="dueDate" type="date" defaultValue={formatDateInput(cheque.dueDate)} />
          </div>

          {status === "CLEARED" ? (
            <div className="space-y-2">
              <Label htmlFor="clearanceDate">Clearance Date</Label>
              <Input id="clearanceDate" name="clearanceDate" type="date" required defaultValue={formatDateInput(cheque.clearanceDate)} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="clearanceDate">Clearance Date (optional)</Label>
              <Input id="clearanceDate" name="clearanceDate" type="date" defaultValue={formatDateInput(cheque.clearanceDate)} />
            </div>
          )}

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="purpose">Purpose / Memo</Label>
            <Input id="purpose" name="purpose" defaultValue={cheque.purpose ?? ""} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={cheque.notes ?? ""} />
          </div>

          {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}

          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save Changes"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
