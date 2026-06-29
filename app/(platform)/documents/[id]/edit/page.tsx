import { forbidden, notFound } from "next/navigation";
import { PlatformHeader } from "@/components/platform/platform-header";
import { EditDocumentForm } from "@/components/documents/edit-document-form";
import { getDocumentById } from "@/lib/data/documents";
import { listEntities } from "@/lib/data/entities";
import { canWrite, requireModuleAccess } from "@/lib/permissions/access";

export default async function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireModuleAccess("DOCUMENTS");
  if (!canWrite(ctx, "DOCUMENTS")) forbidden();

  const [document, entities] = await Promise.all([getDocumentById(ctx, id), listEntities()]);
  if (!document) notFound();

  return (
    <>
      <PlatformHeader title="Edit Document" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <EditDocumentForm document={document} entities={entities} />
      </main>
    </>
  );
}
