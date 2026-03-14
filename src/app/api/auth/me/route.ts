import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSessionFromRequest, createToken, getUserFamilyId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, error, unauthorized } from "@/lib/api";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  if (session.role === "parent") {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, name: true, email: true, darkMode: true, avatar: true },
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
    let needsTokenRefresh = false;

    // Dark mode
    if (body.darkMode !== undefined) {
      updateData.darkMode = Boolean(body.darkMode);
    }

    // Name
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return error("Name cannot be empty");
      updateData.name = name;
      needsTokenRefresh = true;
    }

    // Email
    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase();
      if (!email) return error("Email cannot be empty");
      const existing = await prisma.user.findFirst({
        where: { email, id: { not: session.id } },
      });
      if (existing) return error("Email already in use");
      updateData.email = email;
    }

    // Password change
    if (body.newPassword !== undefined) {
      if (!body.currentPassword) {
        return error("Current password is required");
      }
      const currentUser = await prisma.user.findUnique({
        where: { id: session.id },
        select: { passwordHash: true },
      });
      if (!currentUser) return unauthorized();
      const valid = await bcrypt.compare(body.currentPassword, currentUser.passwordHash);
      if (!valid) return error("Current password is incorrect");
      if (String(body.newPassword).length < 6) {
        return error("New password must be at least 6 characters");
      }
      updateData.passwordHash = await bcrypt.hash(body.newPassword, 12);
    }

    // Avatar
    if (body.avatar !== undefined) {
      updateData.avatar = String(body.avatar);
    }

    if (Object.keys(updateData).length === 0) {
      return error("No valid fields to update");
    }

    const user = await prisma.user.update({
      where: { id: session.id },
      data: updateData,
      select: { id: true, name: true, email: true, darkMode: true, avatar: true },
    });

    const response = NextResponse.json({ data: user });

    // Dark mode cookie
    response.cookies.set("darkMode", user.darkMode ? "1" : "0", {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    // Refresh JWT if name changed (JWT contains name)
    if (needsTokenRefresh) {
      const familyId = await getUserFamilyId(session.id);
      if (familyId) {
        const newToken = await createToken({
          id: session.id,
          role: "parent",
          familyId,
          name: user.name,
        });
        response.cookies.set("token", newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });
      }
    }

    return response;
  } catch (e) {
    console.error("Update user error:", e);
    return error("Failed to update user", 500);
  }
}
