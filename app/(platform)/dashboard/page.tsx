import { PlatformHeader } from "@/components/platform/platform-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireModuleAccess } from "@/lib/permissions/access";

export default async function DashboardPage() {
  await requireModuleAccess("DASHBOARD");
  return (
    <>
      <PlatformHeader title="Dashboard" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {["Portfolio Value", "Net Worth", "Active Assets", "Pending Reminders"].map((label) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-2xl">—</CardTitle>
              </CardHeader>
              <CardContent><p className="text-xs text-muted-foreground">Connect database to populate</p></CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Overview</CardTitle>
            <CardDescription>Consolidated view across all asset classes</CardDescription>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Charts will render here once assets are loaded.</p></CardContent>
        </Card>
      </main>
    </>
  );
}
