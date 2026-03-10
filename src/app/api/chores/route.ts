import { NextRequest } from "next/server";
import { getSessionFromRequest, requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, error, unauthorized } from "@/lib/api";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  const familyId = session.familyId;
  if (!familyId) return unauthorized();

  const chores = await prisma.chore.findMany({
    where: { familyId, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return success(chores);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    requireParent(session);

    const { title, description, icon, starValue, recurringType, recurringDays, isShared } =
      await request.json();

    if (!title) return error("Title is required");
    if (!starValue || starValue < 1) return error("Star value must be at least 1");

    const chore = await prisma.chore.create({
      data: {
        title,
        description: description || "",
        icon: icon || "sparkles",
        starValue,
        recurringType: recurringType || "none",
        recurringDays: recurringDays || "",
        isShared: Boolean(isShared),
        parentId: session!.id,
        familyId: session!.familyId,
      },
    });

    return success(chore, 201);
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return unauthorized(e.message);
    }
    console.error("Create chore error:", e);
    return error("Failed to create chore", 500);
  }
}
