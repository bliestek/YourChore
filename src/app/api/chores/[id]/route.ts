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

    const chore = await prisma.chore.findUnique({ where: { id } });
    if (!chore) return notFound("Chore not found");
    if (chore.familyId !== session!.familyId) return unauthorized();

    const updated = await prisma.chore.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.starValue !== undefined && { starValue: body.starValue }),
        ...(body.recurringType !== undefined && { recurringType: body.recurringType }),
        ...(body.recurringDays !== undefined && { recurringDays: body.recurringDays }),
        ...(body.isShared !== undefined && { isShared: Boolean(body.isShared) }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return success(updated);
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return unauthorized(e.message);
    }
    console.error("Update chore error:", e);
    return error("Failed to update chore", 500);
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

    const chore = await prisma.chore.findUnique({ where: { id } });
    if (!chore) return notFound("Chore not found");
    if (chore.familyId !== session!.familyId) return unauthorized();

    await prisma.chore.delete({ where: { id } });

    return success({ message: "Chore deleted" });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return unauthorized(e.message);
    }
    console.error("Delete chore error:", e);
    return error("Failed to delete chore", 500);
  }
}
