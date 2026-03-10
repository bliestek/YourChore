import { NextRequest } from "next/server";
import { getSessionFromRequest, requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, error, unauthorized } from "@/lib/api";

// GET family info (name, invite code, members)
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    requireParent(session);

    const family = await prisma.family.findUnique({
      where: { id: session!.familyId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!family) return error("Family not found", 404);

    return success({
      id: family.id,
      name: family.name,
      inviteCode: family.inviteCode,
      autoGenerateChores: family.autoGenerateChores,
      members: family.members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return unauthorized(e.message);
    }
    console.error("Get family error:", e);
    return error("Failed to get family info", 500);
  }
}

// PATCH update family name
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    requireParent(session);

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (!body.name || !body.name.trim()) return error("Name is required");
      data.name = body.name.trim();
    }
    if (body.autoGenerateChores !== undefined) {
      data.autoGenerateChores = Boolean(body.autoGenerateChores);
    }

    if (Object.keys(data).length === 0) return error("No fields to update");

    const family = await prisma.family.update({
      where: { id: session!.familyId },
      data,
    });

    return success({
      id: family.id,
      name: family.name,
      autoGenerateChores: family.autoGenerateChores,
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return unauthorized(e.message);
    }
    console.error("Update family error:", e);
    return error("Failed to update family", 500);
  }
}
