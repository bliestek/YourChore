import { NextRequest } from "next/server";
import { getSessionFromRequest, requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, error, unauthorized } from "@/lib/api";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  const familyId = session.familyId;
  if (!familyId) return unauthorized();

  const rawChildren = await prisma.child.findMany({
    where: { familyId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      avatar: true,
      starBalance: true,
      pin: true,
      createdAt: true,
    },
  });

  const children = rawChildren.map(({ pin, ...child }) => ({
    ...child,
    hasPin: !!pin,
  }));

  return success(children);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const parent = requireParent(session);

    const { name, avatar, pin } = await request.json();
    if (!name) return error("Name is required");

    if (pin && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
      return error("PIN must be exactly 4 digits");
    }

    const child = await prisma.child.create({
      data: {
        name,
        avatar: avatar || "bear",
        pin: pin || null,
        parentId: parent.id,
        familyId: session!.familyId,
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        starBalance: true,
        createdAt: true,
      },
    });

    return success(child, 201);
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return unauthorized(e.message);
    }
    console.error("Create child error:", e);
    return error("Failed to create child", 500);
  }
}
