import { NextRequest } from "next/server";
import { getSessionFromRequest, requireParent, createToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, error, unauthorized } from "@/lib/api";

// POST join a family by invite code
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    requireParent(session);

    const { inviteCode } = await request.json();
    if (!inviteCode) return error("Invite code is required");

    // Find the family by invite code
    const family = await prisma.family.findUnique({
      where: { inviteCode: inviteCode.toUpperCase().trim() },
    });

    if (!family) return error("Invalid invite code", 404);

    // Check if already a member
    const existing = await prisma.familyMember.findFirst({
      where: { userId: session!.id, familyId: family.id },
    });

    if (existing) return error("You are already a member of this family");

    // Check if user's current family has any data (children, chores, rewards)
    // If the current family is empty and has no other members, we'll delete it
    const currentFamily = await prisma.family.findUnique({
      where: { id: session!.familyId },
      include: {
        members: true,
        children: { take: 1 },
        chores: { take: 1 },
        rewards: { take: 1 },
      },
    });

    // Remove from current family
    await prisma.familyMember.deleteMany({
      where: { userId: session!.id, familyId: session!.familyId },
    });

    // If old family is now empty, clean it up
    if (currentFamily && currentFamily.members.length <= 1 &&
        currentFamily.children.length === 0 &&
        currentFamily.chores.length === 0 &&
        currentFamily.rewards.length === 0) {
      await prisma.family.delete({ where: { id: currentFamily.id } });
    }

    // Join the new family
    await prisma.familyMember.create({
      data: {
        userId: session!.id,
        familyId: family.id,
        role: "member",
      },
    });

    // Issue a new token with the updated familyId
    const token = await createToken({
      id: session!.id,
      role: "parent",
      familyId: family.id,
      name: session!.name,
    });

    const response = success({
      message: `Joined ${family.name}!`,
      familyId: family.id,
      familyName: family.name,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return unauthorized(e.message);
    }
    console.error("Join family error:", e);
    return error("Failed to join family", 500);
  }
}
