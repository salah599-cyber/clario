import { PlatformHeader } from "@/components/platform/platform-header";
import { UploadDocumentForm } from "@/components/documents/upload-document-form";
import { RowActions } from "@/components/platform/row-actions";
import { listDocuments } from "@/lib/data/documents";
import { deleteDocument } from "@/lib/actions/documents";
import { listDocumentCategories } from "@/lib/data/document-categories";
import { listEntities } from "@/lib/data/entities";
import { canWrite, getModulePermission, requireModuleAccess } from "@/lib/permissions/access";
import { DOCUMENT_STATUS_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function DocumentsPage() {
  const ctx = await requireModuleAccess("DOCUMENTS");
  const [documents, entities, allCategories] = await Promise.all([
    listDocuments(ctx),
    listEntities(),
    listDocumentCategories(),
  ]);
  const showUpload = canWrite(ctx, "DOCUMENTS");
  const level = getModulePermission(ctx, "DOCUMENTS");
  const uploadCategories =
    level === "FILTERED"
      ? allCategories.filter((category) => ctx.documentCategories.includes(category.id))
      : allCategories;

  return (
    <>
      <PlatformHeader title="Document Vault" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        {showUpload ? (
          <UploadDocumentForm
            entities={entities}
            categories={uploadCategories}
            canAddCategory={showUpload}
          />
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Secure storage for KYC, legal, and corporate documents.</CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Uploaded</TableHead>
                    {showUpload ? <TableHead className="w-[60px]">Actions</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {doc.name}
                        </a>
                      </TableCell>
                      <TableCell>{doc.category.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {DOCUMENT_STATUS_LABELS[doc.status] ?? doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{doc.entity?.name ?? "—"}</TableCell>
                      <TableCell>{formatDate(doc.expiryDate)}</TableCell>
                      <TableCell>{formatDate(doc.createdAt)}</TableCell>
                      {showUpload ? (
                        <TableCell>
                          <RowActions
                            editHref={"/documents/" + doc.id + "/edit"}
                            itemId={doc.id}
                            itemLabel={doc.name}
                            deleteAction={deleteDocument}
                          />
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
