import { forbidden, notFound } from "next/navigation";
import { PlatformHeader } from "@/components/platform/platform-header";
import { EditCarForm } from "@/components/cars/edit-car-form";
import { getCar } from "@/lib/actions/cars";
import { listEntities } from "@/lib/data/entities";
import { canWrite, requireModuleAccess } from "@/lib/permissions/access";

export default async function EditCarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireModuleAccess("CARS");
  if (!canWrite(ctx, "CARS")) forbidden();

  const [car, entities] = await Promise.all([getCar(id), listEntities()]);
  if (!car) notFound();

  return (
    <>
      <PlatformHeader title="Edit Vehicle" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <EditCarForm car={car} entities={entities} />
      </main>
    </>
  );
}
