import Link from "next/link";
import { PlatformHeader } from "@/components/platform/platform-header";
import { AddLinkButton } from "@/components/platform/add-link-button";
import { PeCompaniesTable } from "@/components/pe/pe-companies-table";
import { PePortfolioSummaryCards } from "@/components/pe/pe-portfolio-summary";
import {
  getPePortfolioSummary,
  listPeCompanies,
  listPePortfolioEntities,
} from "@/lib/data/pe-portfolio";
import { canWrite, requireModuleAccess } from "@/lib/permissions/access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function PePortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string }>;
}) {
  const { entity: entityParam } = await searchParams;
  const ctx = await requireModuleAccess("PRIVATE_EQUITY");
  const entities = await listPePortfolioEntities(ctx);
  const entityId = entityParam && entities.some((entity) => entity.id === entityParam)
    ? entityParam
    : entities[0]?.id;

  const [summary, companies] = await Promise.all([
    getPePortfolioSummary(ctx, entityId),
    listPeCompanies(ctx, entityId),
  ]);

  const canEdit = canWrite(ctx, "PRIVATE_EQUITY");

  return (
    <>
      <PlatformHeader title="PE / VC Portfolio" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Private Equity & Venture Capital</h2>
            <p className="text-sm text-muted-foreground">
              Track direct investments, cap tables, valuations, and portfolio company performance.
            </p>
          </div>
          {canEdit ? <AddLinkButton href="/portfolio/pe/new" label="Add Company" /> : null}
        </div>

        {entities.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {entities.map((entity) => (
              <Button
                key={entity.id}
                variant={entity.id === entityId ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href={`/portfolio/pe?entity=${entity.id}`}>{entity.name}</Link>
              </Button>
            ))}
          </div>
        ) : null}

        <PePortfolioSummaryCards summary={summary} />

        <Card>
          <CardHeader>
            <CardTitle>Portfolio Companies</CardTitle>
            <CardDescription>
              Direct and fund investments across stages from pre-seed to growth.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PeCompaniesTable companies={companies} canEdit={canEdit} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
