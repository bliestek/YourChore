import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api";

// Public endpoint: look up children by parent email (for child login flow)
// Finds all children in the family that the parent belongs to
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) return error("Email is required");

  // Find the parent user
  const parent = await prisma.user.findUnique({
    where: { email },
    include: {
      familyMemberships: {
        select: { familyId: true },
        take: 1,
      },
    },
  });

  if (!parent || parent.familyMemberships.length === 0) {
    return error("Family not found", 404);
  }

  const familyId = parent.familyMemberships[0].familyId;

  // Get all children in the family (not just this parent's children)
  const children = await prisma.child.findMany({
    where: { familyId },
    select: {
      id: true,
      name: true,
      avatar: true,
      starBalance: true,
      pin: true,
    },
  });

  if (children.length === 0) {
    return error("No children found in this family", 404);
  }

  // Don't expose PIN values, just indicate if one is set
  const safeChildren = children.map((c) => ({
    id: c.id,
    name: c.name,
    avatar: c.avatar,
    starBalance: c.starBalance,
    hasPin: !!c.pin,
  }));

  return success(safeChildren);
}
