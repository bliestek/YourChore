import { NextRequest } from "next/server";
import { getSessionFromRequest, requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, error, unauthorized, notFound } from "@/lib/api";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    requireParent(session);

    const { id } = params;

    const assignment = await prisma.choreAssignment.findUnique({
      where: { id },
      include: { chore: true },
    });

    if (!assignment) return notFound("Assignment not found");
    if (assignment.chore.familyId !== session!.familyId) return unauthorized();

    if (assignment.status !== "completed") {
      return error("This chore is not awaiting approval");
    }

    await prisma.$transaction([
      prisma.choreAssignment.update({
        where: { id },
        data: {
          status: "approved",
          approvedAt: new Date(),
        },
      }),
      prisma.child.update({
        where: { id: assignment.childId },
        data: {
          starBalance: { increment: assignment.chore.starValue },
        },
      }),
      prisma.starTransaction.create({
        data: {
          childId: assignment.childId,
          amount: assignment.chore.starValue,
          type: "earned",
          description: `Approved: ${assignment.chore.title}`,
        },
      }),
    ]);

    return success({ message: "Chore approved and stars awarded" });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return unauthorized(e.message);
    }
    console.error("Approve assignment error:", e);
    return error("Failed to approve assignment", 500);
  }
}
