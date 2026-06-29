"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DocumentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Documents page error:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-lg font-semibold">Could not load documents</h2>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        Something went wrong while loading the document vault. If you just uploaded a file, try
        refreshing the page.
      </p>
      <Button type="button" variant="outline" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
