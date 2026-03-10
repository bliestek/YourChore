import { NextRequest } from "next/server";
import { getSessionFromRequest, requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, error, unauthorized, notFound } from "@/lib/api";

// Adjust stars manually (parent only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    requireParent(session);

    const { id } = params;
    const { amount, description } = await request.json();

    if (typeof amount !== "number" || amount === 0) {
      return error("Amount must be a non-zero number");
    }

    const child = await prisma.child.findUnique({ where: { id } });
    if (!child) return notFound("Child not found");
    if (child.familyId !== session!.familyId) return unauthorized();

    const newBalance = child.starBalance + amount;
    if (newBalance < 0) {
      return error("Cannot reduce stars below zero");
    }

    const [updatedChild] = await prisma.$transaction([
      prisma.child.update({
        where: { id },
        data: { starBalance: newBalance },
      }),
      prisma.starTransaction.create({
        data: {
          childId: id,
          amount,
          type: "adjusted",
          description: description || `Manual adjustment by parent`,
        },
      }),
    ]);

    return success({ starBalance: updatedChild.starBalance });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return unauthorized(e.message);
    }
    console.error("Adjust stars error:", e);
    return error("Failed to adjust stars", 500);
  }
}

// Get star transaction history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  const { id } = params;

  const child = await prisma.child.findUnique({ where: { id } });
  if (!child) return notFound("Child not found");

  if (child.familyId !== session.familyId) return unauthorized();

  const transactions = await prisma.starTransaction.findMany({
    where: { childId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return success(transactions);
}
