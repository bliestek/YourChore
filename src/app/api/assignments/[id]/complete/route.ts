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

    const assignment = await prisma.choreAssignment.findUnique({
      where: { id },
      include: { chore: true, child: true },
    });

    if (!assignment) return notFound("Assignment not found");

    // Child can only complete their own assignments
    if (session.role === "child" && assignment.childId !== session.id) {
      return unauthorized();
    }

    if (assignment.status !== "pending") {
      return error("This chore is already completed");
    }

    const requireApproval = process.env.REQUIRE_APPROVAL === "true";
    const newStatus = requireApproval ? "completed" : "approved";

    // If no approval required, award stars immediately
    if (!requireApproval) {
      await prisma.$transaction([
        prisma.choreAssignment.update({
          where: { id },
          data: {
            status: "approved",
            completedAt: new Date(),
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
            description: `Completed: ${assignment.chore.title}`,
          },
        }),
      ]);
    } else {
      await prisma.choreAssignment.update({
        where: { id },
        data: {
          status: newStatus,
          completedAt: new Date(),
        },
      });
    }

    // If shared chore, auto-complete all other pending assignments for same chore + date
    if (assignment.chore.isShared) {
      const siblingAssignments = await prisma.choreAssignment.findMany({
        where: {
          choreId: assignment.choreId,
          dueDate: assignment.dueDate,
          status: "pending",
          id: { not: assignment.id },
        },
      });

      if (siblingAssignments.length > 0) {
        await prisma.choreAssignment.updateMany({
          where: {
            id: { in: siblingAssignments.map((a) => a.id) },
          },
          data: {
            status: "approved",
            completedAt: new Date(),
            approvedAt: new Date(),
          },
        });
      }
    }

    const updated = await prisma.choreAssignment.findUnique({
      where: { id },
      include: {
        chore: {
          select: { id: true, title: true, icon: true, starValue: true, isShared: true },
        },
      },
    });

    // Return updated child star balance
    const child = await prisma.child.findUnique({
      where: { id: assignment.childId },
      select: { starBalance: true },
    });

    return success({
      assignment: updated,
      starBalance: child?.starBalance,
      starsEarned: !requireApproval ? assignment.chore.starValue : 0,
    });
  } catch (e) {
    console.error("Complete assignment error:", e);
    return error("Failed to complete assignment", 500);
  }
}
