const fs = require("fs");
const path = require("path");
const root = process.cwd();
const w = (p, c) => {
  const f = path.join(root, p);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, c, "utf8");
};

const cronHandler = `import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, job: "PLACEHOLDER" });
}
`;

w("app/api/cron/refresh-aggregates/route.ts", cronHandler.replace("PLACEHOLDER", "refresh-aggregates"));
w("app/api/cron/document-expiry/route.ts", cronHandler.replace("PLACEHOLDER", "document-expiry"));
w("app/api/cron/expense-reminders/route.ts", cronHandler.replace("PLACEHOLDER", "expense-reminders"));
w("app/api/webhooks/clerk/route.ts", `import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ received: true });
}
`);

console.log("batch 3 written");