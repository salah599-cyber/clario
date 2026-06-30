import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "all", label: "All", href: "/assets" },
  { value: "active", label: "Active", href: "/assets?filter=active" },
  { value: "exited", label: "Exited", href: "/assets?filter=exited" },
] as const;

export type AssetsFilter = (typeof TABS)[number]["value"];

export function AssetsFilterTabs({ current }: { current: AssetsFilter }) {
  return (
    <div className="inline-flex gap-1 rounded-lg border p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.value}
          href={tab.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            current === tab.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
