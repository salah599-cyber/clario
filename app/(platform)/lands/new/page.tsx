import { forbidden } from "next/navigation";
import { PlatformHeader } from "@/components/platform/platform-header";
import { CreateLandForm } from "@/components/lands/create-land-form";
import { listEntities } from "@/lib/data/entities";
import { canWrite, requireModuleAccess } from "@/lib/permissions/access";

export default async function NewLandPage() {
  const ctx = await requireModuleAccess("LANDS");
  if (!canWrite(ctx, "LANDS")) forbidden();
  const entities = await listEntities();
  return (
    <>
      <PlatformHeader title="Register Land" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <CreateLandForm entities={entities} />
      </main>
    </>
  );
}
