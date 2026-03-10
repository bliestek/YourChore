import { NextRequest } from "next/server";
import { getSessionFromRequest, requireParent, generateInviteCode } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, error, unauthorized } from "@/lib/api";

// POST regenerate invite code
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    requireParent(session);

    const newCode = generateInviteCode();

    const family = await prisma.family.update({
      where: { id: session!.familyId },
      data: { inviteCode: newCode },
    });

    return success({ inviteCode: family.inviteCode });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return unauthorized(e.message);
    }
    console.error("Regenerate invite code error:", e);
    return error("Failed to regenerate invite code", 500);
  }
}
