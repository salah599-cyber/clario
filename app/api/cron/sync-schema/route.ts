import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const scripts = ["sync-pe-schema.cjs", "sync-asset-distribution-schema.cjs"];
    const results: { script: string; stdout: string; stderr?: string }[] = [];

    for (const script of scripts) {
      const scriptPath = path.join(process.cwd(), "scripts", script);
      const { stdout, stderr } = await execFileAsync("node", [scriptPath], {
        env: process.env,
        timeout: 120_000,
      });
      results.push({
        script,
        stdout: stdout.trim(),
        stderr: stderr.trim() || undefined,
      });
    }

    return NextResponse.json({
      ok: true,
      job: "sync-schema",
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Schema sync failed";
    console.error("sync-schema cron failed:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
