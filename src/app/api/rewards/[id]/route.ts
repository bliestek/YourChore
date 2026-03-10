import { NextRequest } from "next/server";
import { getSessionFromRequest, requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, error, unauthorized, notFound } from "@/lib/api";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    requireParent(session);

    const { id } = params;
    const body = await request.json();

    const reward = await prisma.reward.findUnique({ where: { id } });
    if (!reward) return notFound("Reward not found");
    if (reward.familyId !== session!.familyId) return unauthorized();

    const updated = await prisma.reward.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.starCost !== undefined && { starCost: body.starCost }),
        ...(body.isEnabled !== undefined && { isEnabled: body.isEnabled }),
      },
    });

    return success(updated);
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return unauthorized(e.message);
    }
    console.error("Update reward error:", e);
    return error("Failed to update reward", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    requireParent(session);

    const { id } = params;

    const reward = await prisma.reward.findUnique({ where: { id } });
    if (!reward) return notFound("Reward not found");
    if (reward.familyId !== session!.familyId) return unauthorized();

    await prisma.reward.delete({ where: { id } });

    return success({ message: "Reward deleted" });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return unauthorized(e.message);
    }
    console.error("Delete reward error:", e);
    return error("Failed to delete reward", 500);
  }
}
