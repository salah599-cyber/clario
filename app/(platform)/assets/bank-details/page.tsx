import { PlatformHeader } from "@/components/platform/platform-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <>
      <PlatformHeader title="Bank Details" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
            <CardDescription>Family bank account registry.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Module scaffold ready. Implementation in progress.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
