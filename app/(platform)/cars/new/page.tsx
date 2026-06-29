import { forbidden } from "next/navigation";
import { PlatformHeader } from "@/components/platform/platform-header";
import { CreateCarForm } from "@/components/cars/create-car-form";
import { listEntities } from "@/lib/data/entities";
import { canWrite, requireModuleAccess } from "@/lib/permissions/access";

export default async function NewCarPage() {
  const ctx = await requireModuleAccess("CARS");
  if (!canWrite(ctx, "CARS")) forbidden();
  const entities = await listEntities();

  return (
    <>
      <PlatformHeader title="Register Vehicle" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <CreateCarForm entities={entities} />
      </main>
    </>
  );
}
