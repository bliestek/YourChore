import { NextRequest } from "next/server";
import { getSessionFromRequest, requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, error, unauthorized, notFound } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  const { id } = params;

  const child = await prisma.child.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      avatar: true,
      starBalance: true,
      createdAt: true,
      parentId: true,
      familyId: true,
    },
  });

  if (!child) return notFound("Child not found");

  // Verify access via family
  if (child.familyId !== session.familyId) return unauthorized();

  return success(child);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    requireParent(session);

    const { id } = params;
    const body = await request.json();
    const { name, avatar, pin } = body;

    const child = await prisma.child.findUnique({ where: { id } });
    if (!child) return notFound("Child not found");
    if (child.familyId !== session!.familyId) return unauthorized();

    if (pin !== undefined && pin !== null && pin !== "" && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
      return error("PIN must be exactly 4 digits");
    }

    const updated = await prisma.child.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(avatar !== undefined && { avatar }),
        ...(pin !== undefined && { pin: pin || null }),
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        starBalance: true,
      },
    });

    return success(updated);
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return unauthorized(e.message);
    }
    console.error("Update child error:", e);
    return error("Failed to update child", 500);
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

    const child = await prisma.child.findUnique({ where: { id } });
    if (!child) return notFound("Child not found");
    if (child.familyId !== session!.familyId) return unauthorized();

    await prisma.child.delete({ where: { id } });

    return success({ message: "Child deleted" });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return unauthorized(e.message);
    }
    console.error("Delete child error:", e);
    return error("Failed to delete child", 500);
  }
}
