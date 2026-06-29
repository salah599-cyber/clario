import { forbidden, notFound } from "next/navigation";
import { PlatformHeader } from "@/components/platform/platform-header";
import { EditLandForm } from "@/components/lands/edit-land-form";
import { getLand } from "@/lib/actions/lands";
import { listEntities } from "@/lib/data/entities";
import { canWrite, requireModuleAccess } from "@/lib/permissions/access";

export default async function EditLandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireModuleAccess("LANDS");
  if (!canWrite(ctx, "LANDS")) forbidden();

  const [land, entities] = await Promise.all([getLand(id), listEntities()]);
  if (!land) notFound();

  return (
    <>
      <PlatformHeader title="Edit Land" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <EditLandForm land={land} entities={entities} />
      </main>
    </>
  );
}
