import { PlatformHeader } from "@/components/platform/platform-header";
import { AddLinkButton } from "@/components/platform/add-link-button";
import { CashSummaryCards } from "@/components/cash/cash-summary-cards";
import { CashBreakdown } from "@/components/cash/cash-breakdown";
import { CashAccountsTable } from "@/components/cash/cash-accounts-table";
import { getCashSummary } from "@/lib/data/cash-management";
import { canWrite, requireModuleAccess } from "@/lib/permissions/access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CashManagementPage() {
  const ctx = await requireModuleAccess("CASH_MANAGEMENT");
  const summary = await getCashSummary(ctx);
  const canEdit = canWrite(ctx, "CASH_MANAGEMENT");

  return (
    <>
      <PlatformHeader title="Cash Management" />
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Cash Position</h2>
            <p className="text-sm text-muted-foreground">
              Manual balance tracking across all family office bank accounts.
            </p>
          </div>
          {canEdit ? <AddLinkButton href="/cash/new" label="Add Account" /> : null}
        </div>

        <CashSummaryCards summary={summary} />

        <CashBreakdown
          byBank={summary.byBank}
          byEntity={summary.byEntity}
          byCurrency={summary.byCurrency}
        />

        <Card>
          <CardHeader>
            <CardTitle>All Accounts</CardTitle>
            <CardDescription>
              Balances converted to OMR using the latest available FX rates. Accounts not updated in 30 days are flagged.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CashAccountsTable accounts={summary.accounts} showActions={canEdit} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
