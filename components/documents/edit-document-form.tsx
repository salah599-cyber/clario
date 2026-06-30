"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDocument, type UpdateDocumentInput } from "@/lib/actions/documents";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/labels";
import { formatDateInput } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EntitySelect } from "@/components/platform/entity-select";

type EntityOption = { id: string; name: string };

type DocumentRecord = {
  id: string;
  name: string;
  fileName: string;
  fileUrl: string;
  category: string;
  expiryDate: Date | null;
  entityId: string | null;
};

export function EditDocumentForm({
  document,
  entities,
}: {
  document: DocumentRecord;
  entities: EntityOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(document.category);
  const [entityId, setEntityId] = useState(document.entityId ?? "none");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);

    const input: UpdateDocumentInput = {
      name: String(form.get("name") ?? ""),
      category: category as UpdateDocumentInput["category"],
      expiryDate: String(form.get("expiryDate") ?? ""),
      entityId: entityId === "none" ? undefined : entityId,
    };

    startTransition(async () => {
      try {
        await updateDocument(document.id, input);
        router.push("/documents");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update document.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Document</CardTitle>
        <CardDescription>
          File: {document.fileName} —{" "}
          <a href={document.fileUrl} target="_blank" rel="noopener noreferrer" className="underline">
            Open file
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={document.name} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
            <Input id="expiryDate" name="expiryDate" type="date" defaultValue={formatDateInput(document.expiryDate)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Entity (optional)</Label>
            <EntitySelect entities={entities} value={entityId} onValueChange={setEntityId} allowNone />
          </div>
          {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save Changes"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
