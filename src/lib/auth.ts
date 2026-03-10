import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-dev-secret"
);

export type TokenPayload = {
  id: string;
  role: "parent" | "child";
  familyId: string;
  parentId?: string; // for children, the parent who created them
  name: string;
  parentMode?: boolean; // true when parent is viewing as a child
  parentUserId?: string; // parent's user ID when in parentMode
};

export async function createToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(secret);
}

export async function verifyToken(
  token: string
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getSessionFromRequest(
  request: NextRequest
): Promise<TokenPayload | null> {
  const token =
    request.cookies.get("token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return verifyToken(token);
}

export function requireParent(session: TokenPayload | null): TokenPayload {
  if (!session || session.role !== "parent") {
    throw new Error("Unauthorized: Parent access required");
  }
  return session;
}

export function requireAuth(session: TokenPayload | null): TokenPayload {
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

/** Look up the family ID for a given parent user */
export async function getUserFamilyId(userId: string): Promise<string | null> {
  const membership = await prisma.familyMember.findFirst({
    where: { userId },
    select: { familyId: true },
  });
  return membership?.familyId ?? null;
}

/** Generate a short invite code */
export function generateInviteCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}
