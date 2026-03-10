import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, unauthorized } from "@/lib/api";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  if (session.role === "parent") {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, name: true, email: true, darkMode: true },
    });
    if (!user) return unauthorized();
    return success({ ...user, role: "parent", familyId: session.familyId });
  }

  const child = await prisma.child.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, avatar: true, starBalance: true },
  });
  if (!child) return unauthorized();
  return success({
    ...child,
    role: "child",
    familyId: session.familyId,
    ...(session.parentMode && { parentMode: true }),
  });
}
