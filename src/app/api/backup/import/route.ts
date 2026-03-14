import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { NextRequest } from "next/server";
import { getSessionFromRequest, requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { error, unauthorized, success } from "@/lib/api";
import { getDatabasePath, isValidSQLiteFile } from "@/lib/backup";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    requireParent(session);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return error("No backup file provided");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isValidSQLiteFile(buffer)) {
      return error("Invalid file — not a valid SQLite database");
    }

    const dbPath = getDatabasePath();
    const dbDir = path.dirname(dbPath);
    const backupDir = path.join(dbDir, "backups");

    // Create a safety backup of current DB before replacing
    if (fs.existsSync(dbPath)) {
      fs.mkdirSync(backupDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = path.join(backupDir, `yourchore-pre-import-${timestamp}.db`);
      fs.copyFileSync(dbPath, backupPath);

      const walPath = dbPath + "-wal";
      const shmPath = dbPath + "-shm";
      if (fs.existsSync(walPath)) fs.copyFileSync(walPath, backupPath + "-wal");
      if (fs.existsSync(shmPath)) fs.copyFileSync(shmPath, backupPath + "-shm");
    }

    // Disconnect Prisma before replacing the file
    await prisma.$disconnect();

    // Write the uploaded file
    fs.writeFileSync(dbPath, buffer);

    // Remove stale WAL/SHM files from previous DB
    try { fs.unlinkSync(dbPath + "-wal"); } catch { /* may not exist */ }
    try { fs.unlinkSync(dbPath + "-shm"); } catch { /* may not exist */ }

    // Apply schema updates to the restored DB (it may be from an older version)
    try {
      execSync("node ./node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss 2>&1", {
        timeout: 120000,
        env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
      });
    } catch (pushErr) {
      console.error("Schema push after import failed:", pushErr);
      // Non-fatal — try to continue anyway
    }

    // Reconnect and validate
    await prisma.$connect();
    const userCount = await prisma.user.count();

    return success({
      message: "Database restored successfully",
      userCount,
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return unauthorized(e.message);
    }

    // Try to reconnect Prisma even on failure
    try { await prisma.$connect(); } catch { /* best effort */ }

    console.error("Import backup error:", e);
    return error("Failed to import database. A backup of your previous data was saved.", 500);
  }
}
