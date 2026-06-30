import Link from "next/link";
import { PlatformHeader } from "@/components/platform/platform-header";
import { AddLinkButton } from "@/components/platform/add-link-button";
import { RowActions } from "@/components/platform/row-actions";
import { listCheques, deleteCheque } from "@/lib/actions/cheques";
import { canWrite, requireModuleAccess } from "@/lib/permissions/access";
import {
  CHEQUE_DIRECTION_LABELS,
  CHEQUE_STATUS_LABELS,
} from "@/lib/labels";
import { formatMoney, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "CLEARED") return "default";
  if (status === "BOUNCED" || status === "STOPPED") return "destructive";
  if (status === "CANCELLED") return "outline";
  return "secondary";
}

export default async function ChequesPage() {
  const ctx = await requireModuleAccess("CHEQUES");
  const cheques = await listCheques();
  const showAdd = canWrite(ctx, "CHEQUES");

  const pending = cheques.filter((c) => c.status === "PENDING" || c.status === "DEPOSITED");
  const pendingIssued = pending.filter((c) => c.direction === "ISSUED");
  const pendingReceived = pending.filter((c) => c.direction === "RECEIVED");
  const bounced = cheques.filter((c) => c.status === "BOUNCED");

  const now = new Date();
  const weekAhead = new Date(now);
  weekAhead.setDate(weekAhead.getDate() + 7);
  const dueThisWeek = pending.filter((c) => c.dueDate && c.dueDate <= weekAhead);

  return (
    <>
      <PlatformHeader title="Cheque Management" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending outgoing</CardDescription>
              <CardTitle className="text-2xl">{pendingIssued.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending incoming</CardDescription>
              <CardTitle className="text-2xl">{pendingReceived.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Due this week</CardDescription>
              <CardTitle className="text-2xl">{dueThisWeek.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Bounced</CardDescription>
              <CardTitle className="text-2xl">{bounced.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Cheque Register</CardTitle>
              <CardDescription>
                Track issued and received cheques — {cheques.length} on record.
              </CardDescription>
            </div>
            {showAdd ? <AddLinkButton href="/cheques/new" label="Register Cheque" /> : null}
          </CardHeader>
          <CardContent>
            {cheques.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cheques registered yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cheque #</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Payee / Payer</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Docs</TableHead>
                    {showAdd ? <TableHead className="w-[60px]">Actions</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cheques.map((cheque) => (
                    <TableRow key={cheque.id}>
                      <TableCell className="font-medium">
                        <Link href={"/cheques/" + cheque.id} className="hover:underline">
                          {cheque.chequeNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{CHEQUE_DIRECTION_LABELS[cheque.direction] ?? cheque.direction}</TableCell>
                      <TableCell>{cheque.payee}</TableCell>
                      <TableCell>{cheque.entity.name}</TableCell>
                      <TableCell>
                        {cheque.bankAccount
                          ? cheque.bankAccount.bankName
                          : cheque.bankName ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(cheque.status)}>
                          {CHEQUE_STATUS_LABELS[cheque.status] ?? cheque.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatMoney(cheque.amount, cheque.currency)}</TableCell>
                      <TableCell>{formatDate(cheque.issueDate)}</TableCell>
                      <TableCell>{formatDate(cheque.dueDate)}</TableCell>
                      <TableCell>{cheque.documents.length}</TableCell>
                      {showAdd ? (
                        <TableCell>
                          <RowActions
                            editHref={"/cheques/" + cheque.id + "/edit"}
                            itemId={cheque.id}
                            itemLabel={"Cheque #" + cheque.chequeNumber}
                            deleteAction={deleteCheque}
                          />
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
