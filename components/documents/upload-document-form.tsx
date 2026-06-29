"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveDocumentMetadata } from "@/lib/actions/documents";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/labels";
import { MAX_UPLOAD_LABEL, validateUploadFileSize } from "@/lib/upload-limits";
import type { DocumentCategory } from "@/lib/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EntityOption = { id: string; name: string };

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function UploadDocumentForm({ entities }: { entities: EntityOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [category, setCategory] = useState("CORPORATE");
  const [entityId, setEntityId] = useState<string>("none");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError("A file is required.");
      return;
    }

    const sizeError = validateUploadFileSize(file);
    if (sizeError) {
      setError(sizeError);
      return;
    }

    const name = String(formData.get("name") ?? "").trim();
    const expiryDateRaw = String(formData.get("expiryDate") ?? "").trim();
    const entityIdValue = entityId === "none" ? "" : entityId;

    if (!name) {
      setError("Document name is required.");
      return;
    }

    startTransition(async () => {
      try {
        const pathname = "documents/" + Date.now() + "-" + sanitizeFileName(file.name);

        const uploadData = new FormData();
        uploadData.set("file", file);
        uploadData.set("pathname", pathname);

        const uploadRes = await fetch("/api/documents/upload", {
          method: "POST",
          body: uploadData,
          credentials: "same-origin",
        });

        const uploadBody = (await uploadRes.json().catch(() => ({}))) as {
          url?: string;
          error?: string;
        };

        if (!uploadRes.ok || !uploadBody.url) {
          throw new Error(uploadBody.error ?? "Failed to upload file to storage.");
        }

        const doc = await saveDocumentMetadata({
          name,
          category: category as DocumentCategory,
          fileName: file.name,
          fileUrl: uploadBody.url,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          expiryDate: expiryDateRaw || undefined,
          entityId: entityIdValue || undefined,
        });

        setSuccess("Uploaded " + doc.name);
        form.reset();
        setEntityId("none");
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to upload document.";
        if (message.toLowerCase().includes("body exceeded") || message.includes("413")) {
          setError(`File is too large. Maximum upload size is ${MAX_UPLOAD_LABEL}.`);
          return;
        }
        setError(message);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="file">File</Label>
            <Input
              id="file"
              name="file"
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
            />
            <p className="text-xs text-muted-foreground">Maximum file size: {MAX_UPLOAD_LABEL}</p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="Document title" />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
            <Input id="expiryDate" name="expiryDate" type="date" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Entity (optional)</Label>
            <Select value={entityId} onValueChange={setEntityId}>
              <SelectTrigger>
                <SelectValue placeholder="Select entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {entities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <p className="text-sm text-destructive md:col-span-2">{error}</p>
          ) : null}
          {success ? (
            <p className="text-sm text-green-600 md:col-span-2">{success}</p>
          ) : null}

          <div className="md:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Uploading..." : "Upload Document"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
