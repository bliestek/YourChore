import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, requireParent, createToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { error, unauthorized } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    requireParent(session);

    const { childId } = await request.json();
    if (!childId) return error("Child ID is required");

    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) return error("Child not found", 404);
    if (child.familyId !== session!.familyId) return unauthorized();

    // Create child token with parentMode flag
    const childToken = await createToken({
      id: child.id,
      role: "child",
      familyId: child.familyId,
      parentId: child.parentId,
      name: child.name,
      parentMode: true,
      parentUserId: session!.id,
    });

    // Save parent token and set child token
    const parentToken = request.cookies.get("token")?.value;

    const response = NextResponse.json({
      id: child.id,
      name: child.name,
      avatar: child.avatar,
      starBalance: child.starBalance,
    });

    response.cookies.set("parent-token", parentToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
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
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return unauthorized(e.message);
    }
    console.error("View as child error:", e);
    return error("Failed to switch to child view", 500);
  }
}
