"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteAssetDistribution,
  deleteAssetDistributionDocument,
  upsertAssetDistribution,
} from "@/lib/actions/asset-distributions";
import { DeleteEntryButton } from "@/components/platform/delete-entry-button";
import {
  ASSET_DISTRIBUTION_SOURCE_LABELS,
  ASSET_DISTRIBUTION_TYPE_LABELS,
} from "@/lib/labels";
import { formatDate, formatMoney } from "@/lib/format";
import type { AssetDistributionMetrics } from "@/lib/assets/distribution-metrics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DistributionRow = {
  id: string;
  distributionDate: Date;
  amount: { toString(): string };
  currency: string;
  netAmount: { toString(): string } | null;
  taxWithheld: { toString(): string } | null;
  distributionType: string;
  source: string;
  bankReference: string | null;
  notes: string | null;
  peDistributionId: string | null;
  documents: {
    id: string;
    fileName: string;
    fileUrl: string;
  }[];
};

export function AssetDistributionsSection({
  assetId,
  assetName,
  currency,
  distributions,
  metrics,
  canEdit,
  peCompany,
}: {
  assetId: string;
  assetName: string;
  currency: string;
  distributions: DistributionRow[];
  metrics: AssetDistributionMetrics;
  canEdit: boolean;
  peCompany: { id: string; name: string } | null;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DistributionRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [distributionType, setDistributionType] = useState(
    editing?.distributionType ?? "DIVIDEND",
  );

  const canRecordManual = canEdit && !peCompany;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("distributionType", distributionType);
    formData.set("currency", currency);
    if (editing?.id) formData.set("id", editing.id);

    startTransition(async () => {
      try {
        await upsertAssetDistribution(assetId, formData);
        setShowForm(false);
        setEditing(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save distribution.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Distributions & Income</CardTitle>
          <CardDescription>
            Dividends, coupons, interest, and other cash received from {assetName}.
          </CardDescription>
        </div>
        {canRecordManual ? (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditing(null);
              setDistributionType("DIVIDEND");
              setShowForm(true);
            }}
          >
            Record distribution
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {peCompany ? (
          <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            This asset is linked to{" "}
            <a href={`/portfolio/pe/${peCompany.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
              {peCompany.name}
            </a>
            . Record new distributions in the PE / VC portfolio — they appear here automatically.
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryTile label="Total received" value={formatMoney(metrics.totalDistributed, currency)} />
          <SummaryTile label="YTD received" value={formatMoney(metrics.distributedYtd, currency)} />
          <SummaryTile
            label="Last distribution"
            value={metrics.lastDistributionDate ? formatDate(metrics.lastDistributionDate) : "—"}
          />
          <SummaryTile
            label="DPI"
            value={metrics.dpiPct != null ? `${metrics.dpiPct.toFixed(1)}%` : "—"}
          />
        </div>

        {showForm && canRecordManual ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">
                {editing ? "Edit distribution" : "Record distribution"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="distributionDate">Date received</Label>
                  <Input
                    id="distributionDate"
                    name="distributionDate"
                    type="date"
                    required
                    defaultValue={
                      editing
                        ? editing.distributionDate.toISOString().slice(0, 10)
                        : new Date().toISOString().slice(0, 10)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={distributionType} onValueChange={setDistributionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ASSET_DISTRIBUTION_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Gross amount ({currency})</Label>
                  <Input
                    id="amount"
                    name="amount"
                    required
                    defaultValue={editing?.amount.toString()}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="netAmount">Net amount ({currency})</Label>
                  <Input
                    id="netAmount"
                    name="netAmount"
                    defaultValue={editing?.netAmount?.toString() ?? ""}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxWithheld">Tax withheld</Label>
                  <Input id="taxWithheld" name="taxWithheld" placeholder="Optional" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankReference">Bank reference</Label>
                  <Input id="bankReference" name="bankReference" defaultValue={editing?.bankReference ?? ""} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={2} defaultValue={editing?.notes ?? ""} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="files">Supporting documents</Label>
                  <Input id="files" name="files" type="file" multiple />
                </div>
                {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
                <div className="flex gap-2 md:col-span-2">
                  <Button type="submit" disabled={pending}>
                    {pending ? "Saving…" : editing ? "Update" : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditing(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : null}

        {distributions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No distributions recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Notes</TableHead>
                {canEdit ? <TableHead className="w-[100px]">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {distributions.map((row) => {
                const isPeLinked = Boolean(row.peDistributionId) || row.source === "PRIVATE_EQUITY";
                return (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.distributionDate)}</TableCell>
                    <TableCell>
                      {ASSET_DISTRIBUTION_TYPE_LABELS[row.distributionType] ?? row.distributionType}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ASSET_DISTRIBUTION_SOURCE_LABELS[row.source] ?? row.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(row.amount, row.currency)}
                      {row.netAmount ? (
                        <p className="text-xs text-muted-foreground">
                          Net {formatMoney(row.netAmount, row.currency)}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate">{row.bankReference ?? "—"}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{row.notes ?? "—"}</TableCell>
                    {canEdit ? (
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {!isPeLinked ? (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditing(row);
                                  setDistributionType(row.distributionType);
                                  setShowForm(true);
                                }}
                              >
                                Edit
                              </Button>
                              <DeleteEntryButton
                                itemId={row.id}
                                itemLabel="distribution"
                                deleteAction={deleteAssetDistribution}
                                title="Delete distribution?"
                              />
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">PE managed</span>
                          )}
                        </div>
                        {row.documents.length > 0 ? (
                          <div className="mt-1 space-y-1">
                            {row.documents.map((doc) => (
                              <div key={doc.id} className="flex items-center gap-1 text-xs">
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="truncate text-primary hover:underline"
                                >
                                  {doc.fileName}
                                </a>
                                {!isPeLinked ? (
                                  <DeleteEntryButton
                                    itemId={doc.id}
                                    itemLabel={doc.fileName}
                                    deleteAction={deleteAssetDistributionDocument}
                                    title="Delete document?"
                                  />
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
