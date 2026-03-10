import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createToken, generateInviteCode } from "@/lib/auth";
import { success, error } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const { email, name, password } = await request.json();

    if (!email || !name || !password) {
      return error("Email, name, and password are required");
    }

    if (password.length < 6) {
      return error("Password must be at least 6 characters");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return error("Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { user, family } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name, passwordHash },
      });

      const family = await tx.family.create({
        data: {
          name: `${user.name}'s Family`,
          inviteCode: generateInviteCode(),
        },
      });

      await tx.familyMember.create({
        data: {
          userId: user.id,
          familyId: family.id,
          role: "admin",
        },
      });

      return { user, family };
    });

    const token = await createToken({
      id: user.id,
      role: "parent",
      familyId: family.id,
      name: user.name,
    });

    const response = success({ user: { id: user.id, name: user.name, email: user.email } }, 201);
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (e) {
    console.error("Register error:", e);
    return error("Registration failed", 500);
  }
}
