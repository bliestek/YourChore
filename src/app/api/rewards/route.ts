import { NextRequest } from "next/server";
import { getSessionFromRequest, requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, error, unauthorized } from "@/lib/api";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  const familyId = session.familyId;
  if (!familyId) return unauthorized();

  const rewards = await prisma.reward.findMany({
    where: {
      familyId,
      ...(session.role === "child" && { isEnabled: true }),
    },
    orderBy: { starCost: "asc" },
  });

  return success(rewards);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    requireParent(session);

    const { title, description, icon, starCost } = await request.json();

    if (!title) return error("Title is required");
    if (!starCost || starCost < 1) return error("Star cost must be at least 1");

    const reward = await prisma.reward.create({
      data: {
        title,
        description: description || "",
        icon: icon || "gift",
        starCost,
        parentId: session!.id,
        familyId: session!.familyId,
      },
    });

    return success(reward, 201);
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return unauthorized(e.message);
    }
    console.error("Create reward error:", e);
    return error("Failed to create reward", 500);
  }
}
