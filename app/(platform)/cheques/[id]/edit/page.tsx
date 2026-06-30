import { forbidden, notFound } from "next/navigation";
import { PlatformHeader } from "@/components/platform/platform-header";
import { EditChequeForm } from "@/components/cheques/edit-cheque-form";
import { getCheque, listChequeBankAccountOptions } from "@/lib/actions/cheques";
import { listEntities } from "@/lib/data/entities";
import { canWrite, requireModuleAccess } from "@/lib/permissions/access";

export default async function EditChequePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireModuleAccess("CHEQUES");
  if (!canWrite(ctx, "CHEQUES")) forbidden();

  const [cheque, entities, bankAccounts] = await Promise.all([
    getCheque(id),
    listEntities(),
    listChequeBankAccountOptions(),
  ]);
  if (!cheque) notFound();

  return (
    <>
      <PlatformHeader title="Edit Cheque" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <EditChequeForm cheque={cheque} entities={entities} bankAccounts={bankAccounts} />
      </main>
    </>
  );
}
