import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, error, unauthorized } from "@/lib/api";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  if (session.role === "parent") {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, name: true, email: true, darkMode: true },
    });
    if (!user) return unauthorized();
    return success({ ...user, role: "parent", familyId: session.familyId });
  }

  const child = await prisma.child.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, avatar: true, starBalance: true },
  });
  if (!child) return unauthorized();
  return success({
    ...child,
    role: "child",
    familyId: session.familyId,
    ...(session.parentMode && { parentMode: true }),
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "parent") return unauthorized();

  try {
    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.darkMode !== undefined) {
      updateData.darkMode = Boolean(body.darkMode);
    }

    if (Object.keys(updateData).length === 0) {
      return error("No valid fields to update");
    }

    const user = await prisma.user.update({
      where: { id: session.id },
      data: updateData,
      select: { id: true, name: true, email: true, darkMode: true },
    });

    // Set a cookie so dark mode can be applied before JS hydration
    const response = NextResponse.json({ data: user });
    response.cookies.set("darkMode", user.darkMode ? "1" : "0", {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (e) {
    console.error("Update user error:", e);
    return error("Failed to update user", 500);
  }
}
