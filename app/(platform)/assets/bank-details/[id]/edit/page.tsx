import { forbidden, notFound } from "next/navigation";
import { PlatformHeader } from "@/components/platform/platform-header";
import { EditBankForm } from "@/components/bank/edit-bank-form";
import { getBankAccount } from "@/lib/actions/bank-accounts";
import { listEntities } from "@/lib/data/entities";
import { canWrite, requireModuleAccess } from "@/lib/permissions/access";

export default async function EditBankAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireModuleAccess("ASSETS");
  if (!canWrite(ctx, "ASSETS")) forbidden();

  const [account, entities] = await Promise.all([getBankAccount(id), listEntities()]);
  if (!account) notFound();

  return (
    <>
      <PlatformHeader title="Edit Bank Account" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <EditBankForm account={account} entities={entities} />
      </main>
    </>
  );
}
