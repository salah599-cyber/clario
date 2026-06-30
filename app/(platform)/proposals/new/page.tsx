import { forbidden } from "next/navigation";
import { PlatformHeader } from "@/components/platform/platform-header";
import { CreateProposalForm } from "@/components/proposals/create-proposal-form";
import { listActiveUsersForProposals } from "@/lib/actions/proposals";
import { canSubmitProposal } from "@/lib/proposals/submit-access";
import { listEntities } from "@/lib/data/entities";
import { requireModuleAccess, requireUserContext } from "@/lib/permissions/access";

export default async function NewProposalPage() {
  const ctx = await requireUserContext();
  await requireModuleAccess("PROPOSALS");
  if (!canSubmitProposal(ctx)) forbidden();

  const [entities, users] = await Promise.all([listEntities(), listActiveUsersForProposals()]);

  return (
    <>
      <PlatformHeader title="New Proposal" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <CreateProposalForm entities={entities} users={users} currentUserId={ctx.id} />
      </main>
    </>
  );
}
