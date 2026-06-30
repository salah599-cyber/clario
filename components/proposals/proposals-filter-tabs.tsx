import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "all", label: "All", href: "/proposals" },
  { value: "mine", label: "Mine", href: "/proposals?filter=mine" },
  { value: "pending-approval", label: "Pending My Approval", href: "/proposals?filter=pending-approval" },
  { value: "approved", label: "Approved", href: "/proposals?filter=approved" },
  { value: "rejected", label: "Rejected", href: "/proposals?filter=rejected" },
] as const;

export type ProposalsFilter = (typeof TABS)[number]["value"];

export function ProposalsFilterTabs({ current }: { current: ProposalsFilter }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border p-1">
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
