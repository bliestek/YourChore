import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { error, unauthorized } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const parentToken = request.cookies.get("parent-token")?.value;
    if (!parentToken) return error("No parent session to restore");

    // Verify the parent token is still valid
    const payload = await verifyToken(parentToken);
    if (!payload || payload.role !== "parent") {
      return unauthorized("Parent session expired");
    }

    const response = NextResponse.json({ message: "Switched back to parent" });

    // Restore parent token
    response.cookies.set("token", parentToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    // Clear parent-token cookie
    response.cookies.set("parent-token", "", {
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (e) {
    console.error("Back to parent error:", e);
    return error("Failed to switch back to parent", 500);
  }
}
