import path from "path";

export function getDatabasePath(): string {
  const dbUrl = process.env.DATABASE_URL || "file:./data/yourchore.db";
  const filePath = dbUrl.replace(/^file:/, "");
  // Absolute paths (Docker: file:/app/data/yourchore.db) resolve directly.
  // Relative paths (dev: file:./data/yourchore.db) resolve from prisma/ dir
  // because Prisma resolves relative to the schema file location.
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  const schemaDir = path.resolve(process.cwd(), "prisma");
  return path.resolve(schemaDir, filePath);
}

export function isValidSQLiteFile(buffer: Buffer): boolean {
  if (buffer.length < 16) return false;
  const header = buffer.slice(0, 16).toString("ascii");
  return header === "SQLite format 3\0";
}
