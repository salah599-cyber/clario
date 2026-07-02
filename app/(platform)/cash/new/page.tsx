import { PlatformHeader } from "@/components/platform/platform-header";
import { CreateCashAccountForm } from "@/components/cash/create-cash-account-form";
import { listEntities } from "@/lib/data/entities";
import { canWrite, requireModuleAccess } from "@/lib/permissions/access";
import { forbidden } from "next/navigation";

export default async function NewCashAccountPage() {
  const ctx = await requireModuleAccess("CASH_MANAGEMENT");
  if (!canWrite(ctx, "CASH_MANAGEMENT")) forbidden();

  const entities = await listEntities();

  return (
    <>
      <PlatformHeader title="Add Bank Account" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <CreateCashAccountForm entities={entities} />
      </main>
    </>
  );
}
