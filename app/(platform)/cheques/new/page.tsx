import { forbidden } from "next/navigation";
import { PlatformHeader } from "@/components/platform/platform-header";
import { CreateChequeForm } from "@/components/cheques/create-cheque-form";
import { listEntities } from "@/lib/data/entities";
import { listChequeBankAccountOptions } from "@/lib/actions/cheques";
import { canWrite, requireModuleAccess } from "@/lib/permissions/access";

export default async function NewChequePage() {
  const ctx = await requireModuleAccess("CHEQUES");
  if (!canWrite(ctx, "CHEQUES")) forbidden();

  const [entities, bankAccounts] = await Promise.all([
    listEntities(),
    listChequeBankAccountOptions(),
  ]);

  return (
    <>
      <PlatformHeader title="Register Cheque" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <CreateChequeForm entities={entities} bankAccounts={bankAccounts} />
      </main>
    </>
  );
}
