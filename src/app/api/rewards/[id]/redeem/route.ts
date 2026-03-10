import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, error, unauthorized, notFound } from "@/lib/api";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return unauthorized();

    const { id } = params;

    // Determine the child who is redeeming
    let childId: string;
    if (session.role === "child") {
      childId = session.id;
    } else {
      const body = await request.json();
      childId = body.childId;
      if (!childId) return error("Child ID is required");
    }

    const [reward, child] = await Promise.all([
      prisma.reward.findUnique({ where: { id } }),
      prisma.child.findUnique({ where: { id: childId } }),
    ]);

    if (!reward) return notFound("Reward not found");
    if (!child) return notFound("Child not found");
    if (!reward.isEnabled) return error("This reward is not available");

    // Verify child and reward belong to the same family
    if (child.familyId !== reward.familyId) return unauthorized();

    if (child.starBalance < reward.starCost) {
      return error(
        `Not enough stars! Need ${reward.starCost}, have ${child.starBalance}`
      );
    }

    await prisma.$transaction([
      prisma.child.update({
        where: { id: childId },
        data: {
          starBalance: { decrement: reward.starCost },
        },
      }),
      prisma.starTransaction.create({
        data: {
          childId,
          amount: -reward.starCost,
          type: "spent",
          description: `Redeemed: ${reward.title}`,
        },
      }),
      prisma.rewardRedemption.create({
        data: {
          rewardId: id,
          childId,
          starsSpent: reward.starCost,
        },
      }),
    ]);

    const updatedChild = await prisma.child.findUnique({
      where: { id: childId },
      select: { starBalance: true },
    });

    return success({
      message: `Redeemed: ${reward.title}`,
      starBalance: updatedChild?.starBalance,
    });
  } catch (e) {
    console.error("Redeem reward error:", e);
    return error("Failed to redeem reward", 500);
  }
}
