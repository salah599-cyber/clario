/** Keep below next.config serverActions.bodySizeLimit (15mb) to allow multipart overhead. */
export const MAX_UPLOAD_BYTES = 14 * 1024 * 1024;

export const MAX_UPLOAD_LABEL = "14 MB";

export function validateUploadFileSize(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) {
    return `File is too large (${formatBytes(file.size)}). Maximum size is ${MAX_UPLOAD_LABEL}.`;
  }
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
