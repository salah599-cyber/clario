import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EditLinkButton({ href, label = "Edit" }: { href: string; label?: string }) {
  return (
    <Button asChild variant="ghost" size="sm" aria-label={label}>
      <Link href={href}>
        <Pencil className="size-4" />
      </Link>
    </Button>
  );
}
