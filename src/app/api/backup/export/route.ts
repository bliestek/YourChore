import fs from "fs";
import { NextRequest } from "next/server";
import { getSessionFromRequest, requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { error, unauthorized } from "@/lib/api";
import { getDatabasePath } from "@/lib/backup";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    requireParent(session);

    const dbPath = getDatabasePath();

    if (!fs.existsSync(dbPath)) {
      return error("Database file not found", 500);
    }

    // Flush WAL to main DB file so the export is complete
    try {
      await prisma.$queryRawUnsafe("PRAGMA wal_checkpoint(TRUNCATE)");
    } catch {
      // Non-fatal — DB might not be in WAL mode
    }

    const buffer = fs.readFileSync(dbPath);
    const date = new Date().toISOString().slice(0, 10);
    const filename = `yourchore-backup-${date}.db`;

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/x-sqlite3",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return unauthorized(e.message);
    }
    console.error("Export backup error:", e);
    return error("Failed to export database", 500);
  }
}
