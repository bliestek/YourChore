import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createToken } from "@/lib/auth";
import { success, error } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const { childId, pin } = await request.json();

    if (!childId) {
      return error("Child ID is required");
    }

    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: { parent: true },
    });

    if (!child) {
      return error("Child not found", 404);
    }

    // If child has a PIN, verify it
    if (child.pin && child.pin !== pin) {
      return error("Wrong PIN", 401);
    }

    const token = await createToken({
      id: child.id,
      role: "child",
      familyId: child.familyId,
      parentId: child.parentId,
      name: child.name,
    });

    const response = success({
      child: {
        id: child.id,
        name: child.name,
        avatar: child.avatar,
        starBalance: child.starBalance,
      },
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
    console.error("Child login error:", e);
    return error("Login failed", 500);
  }
}
