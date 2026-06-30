import { forbidden, notFound } from "next/navigation";
import { PlatformHeader } from "@/components/platform/platform-header";
import { EditProposalForm } from "@/components/proposals/edit-proposal-form";
import { getProposal, listActiveUsersForProposals } from "@/lib/actions/proposals";
import { canSubmitProposal } from "@/lib/proposals/submit-access";
import { listEntities } from "@/lib/data/entities";
import { requireModuleAccess, requireUserContext } from "@/lib/permissions/access";

export default async function EditProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireUserContext();
  await requireModuleAccess("PROPOSALS");
  if (!canSubmitProposal(ctx)) forbidden();

  const [proposal, entities, users] = await Promise.all([
    getProposal(id),
    listEntities(),
    listActiveUsersForProposals(),
  ]);
  if (!proposal) notFound();
  if (proposal.submittedById !== ctx.id && !ctx.isSuperAdmin) forbidden();
  if (proposal.status !== "DRAFT" && proposal.status !== "RETURNED") forbidden();

  return (
    <>
      <PlatformHeader title="Edit Proposal" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <EditProposalForm
          proposal={proposal}
          entities={entities}
          users={users}
          currentUserId={ctx.id}
        />
      </main>
    </>
  );
}
