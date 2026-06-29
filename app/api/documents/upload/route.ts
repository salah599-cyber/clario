import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { canWrite, getCurrentUserContext } from "@/lib/permissions/access";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";

export async function POST(request: Request): Promise<NextResponse> {
  const ctx = await getCurrentUserContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canWrite(ctx, "DOCUMENTS")) {
    return NextResponse.json(
      { error: "You do not have permission to upload documents." },
      { status: 403 },
    );
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      {
        error:
          "BLOB_READ_WRITE_TOKEN is not configured. Add it in Vercel → Project → Settings → Environment Variables (Storage → Blob).",
      },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "File is too large. Maximum size is 14 MB." },
      { status: 413 },
    );
  }

  const pathnameRaw = String(formData.get("pathname") ?? "").trim();
  const pathname =
    pathnameRaw ||
    "documents/" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

  try {
    const blob = await put(pathname, file, {
      access: "public",
      token,
      contentType: file.type || undefined,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
