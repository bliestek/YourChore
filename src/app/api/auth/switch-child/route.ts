import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, createToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { error, unauthorized } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return unauthorized();

    const { childId, pin } = await request.json();
    if (!childId) return error("Child ID is required");

    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) return error("Child not found", 404);
    if (child.familyId !== session.familyId) return unauthorized();

    // If not in parentMode and child has a PIN, verify it
    if (!session.parentMode && child.pin && child.pin !== pin) {
      return error("Wrong PIN", 401);
    }

    // Create new child token, preserving parentMode if it was set
    const childToken = await createToken({
      id: child.id,
      role: "child",
      familyId: child.familyId,
      parentId: child.parentId,
      name: child.name,
      ...(session.parentMode && {
        parentMode: true,
        parentUserId: session.parentUserId,
      }),
    });

    const response = NextResponse.json({
      id: child.id,
      name: child.name,
      avatar: child.avatar,
      starBalance: child.starBalance,
    });

    response.cookies.set("token", childToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (e) {
    console.error("Switch child error:", e);
    return error("Failed to switch child", 500);
  }
}
