import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createToken, getUserFamilyId, generateInviteCode } from "@/lib/auth";
import { success, error } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return error("Email and password are required");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return error("Invalid email or password", 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return error("Invalid email or password", 401);
    }

    let familyId = await getUserFamilyId(user.id);

    // Edge case: old users who don't have a family yet
    if (!familyId) {
      const family = await prisma.family.create({
        data: {
          name: `${user.name}'s Family`,
          inviteCode: generateInviteCode(),
        },
      });
      await prisma.familyMember.create({
        data: {
          userId: user.id,
          familyId: family.id,
          role: "admin",
        },
      });
      familyId = family.id;
    }

    const token = await createToken({
      id: user.id,
      role: "parent",
      familyId,
      name: user.name,
    });

    const response = success({
      user: { id: user.id, name: user.name, email: user.email },
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
    console.error("Login error:", e);
    return error("Login failed", 500);
  }
}
