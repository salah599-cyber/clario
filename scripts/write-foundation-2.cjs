const fs = require("fs");
const path = require("path");
const root = process.cwd();
const w = (p, c) => {
  const f = path.join(root, p);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, c, "utf8");
};

w("middleware.ts", `import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/api/webhooks(.*)",
  "/api/share/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
`);

w("app/layout.tsx", `import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jawan Investments",
  description: "Family Office Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={\`\${geistSans.variable} \${geistMono.variable} h-full\`}>
        <body className="min-h-full font-sans antialiased">
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
`);

w("app/page.tsx", `import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();
  redirect(userId ? "/dashboard" : "/sign-in");
}
`);

w("app/(auth)/sign-in/[[...sign-in]]/page.tsx", `import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-in" />
    </div>
  );
}
`);

w("components/platform/app-sidebar.tsx", `"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Receipt,
  BarChart3,
  Users,
  ScrollText,
  Landmark,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets", label: "Assets", icon: Building2 },
  { href: "/assets/bank-details", label: "Bank Details", icon: Landmark },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Jawan Investments</p>
          <p className="text-lg font-semibold">Family Office</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href || pathname.startsWith(item.href + "/")}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
`);

w("components/platform/platform-header.tsx", `"use client";

import { UserButton } from "@clerk/nextjs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export function PlatformHeader({ title }: { title: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="flex-1 text-sm font-medium">{title}</h1>
      <UserButton afterSignOutUrl="/sign-in" />
    </header>
  );
}
`);

w("app/(platform)/layout.tsx", `import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/platform/app-sidebar";
import { syncClerkUser } from "@/lib/auth/sync-user";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  await syncClerkUser();
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
`);

const stub = (title, desc) => `import { PlatformHeader } from "@/components/platform/platform-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <>
      <PlatformHeader title="${title}" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>${title}</CardTitle>
            <CardDescription>${desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Module scaffold ready. Implementation in progress.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
`;

w("app/(platform)/dashboard/page.tsx", `import { PlatformHeader } from "@/components/platform/platform-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireModuleAccess } from "@/lib/permissions/access";

export default async function DashboardPage() {
  await requireModuleAccess("DASHBOARD");
  return (
    <>
      <PlatformHeader title="Dashboard" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {["Portfolio Value", "Net Worth", "Active Assets", "Pending Reminders"].map((label) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-2xl">—</CardTitle>
              </CardHeader>
              <CardContent><p className="text-xs text-muted-foreground">Connect database to populate</p></CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Overview</CardTitle>
            <CardDescription>Consolidated view across all asset classes</CardDescription>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Charts will render here once assets are loaded.</p></CardContent>
        </Card>
      </main>
    </>
  );
}
`);

w("app/(platform)/assets/page.tsx", stub("Assets", "Manage real estate, private equity, public markets, and more."));
w("app/(platform)/assets/bank-details/page.tsx", stub("Bank Details", "Family bank account registry."));
w("app/(platform)/documents/page.tsx", stub("Document Vault", "Secure storage for KYC, legal, and corporate documents."));
w("app/(platform)/expenses/page.tsx", stub("Expenses", "Track recurring and one-time expenses."));
w("app/(platform)/reports/page.tsx", stub("Reports", "Generate net worth, performance, and custom reports."));
w("app/(platform)/admin/users/page.tsx", stub("User Management", "Invite users and assign roles."));
w("app/(platform)/admin/audit-log/page.tsx", stub("Audit Log", "View platform activity history."));

w(".env.example", `# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in

# Neon Postgres
DATABASE_URL=

# Vercel Blob
BLOB_READ_WRITE_TOKEN=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=notifications@jawaninvestments.com

# Cron secret
CRON_SECRET=
`);

w("vercel.json", `{
  "crons": [
    { "path": "/api/cron/refresh-aggregates", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/document-expiry", "schedule": "0 6 * * *" },
    { "path": "/api/cron/expense-reminders", "schedule": "0 7 * * *" }
  ]
}
`);

console.log("batch 2 written");