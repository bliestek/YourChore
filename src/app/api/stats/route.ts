import { NextRequest } from "next/server";
import { getSessionFromRequest, requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, error, unauthorized } from "@/lib/api";
import { startOfWeek } from "@/lib/dates";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    requireParent(session);

    const weekStart = startOfWeek();

    const [
      children,
      weeklyAssignments,
      totalRedemptions,
      recentTransactions,
    ] = await Promise.all([
      prisma.child.findMany({
        where: { familyId: session!.familyId },
        select: { id: true, name: true, avatar: true, starBalance: true },
      }),
      prisma.choreAssignment.findMany({
        where: {
          child: { familyId: session!.familyId },
          dueDate: { gte: weekStart },
        },
        include: {
          chore: { select: { title: true, starValue: true } },
          child: { select: { name: true, avatar: true } },
        },
      }),
      prisma.rewardRedemption.findMany({
        where: {
          child: { familyId: session!.familyId },
          redeemedAt: { gte: weekStart },
        },
        include: {
          reward: { select: { title: true, starCost: true } },
          child: { select: { name: true } },
        },
      }),
      prisma.starTransaction.findMany({
        where: {
          child: { familyId: session!.familyId },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          child: { select: { name: true, avatar: true } },
        },
      }),
    ]);

    // Compute weekly stats per child
    const weeklyStats = children.map((child) => {
      const assignments = weeklyAssignments.filter(
        (a) => a.childId === child.id
      );
      const completed = assignments.filter(
        (a) => a.status === "approved" || a.status === "completed"
      );
      const starsEarned = completed.reduce(
        (sum, a) => sum + (a.chore?.starValue || 0),
        0
      );

      return {
        child,
        totalAssigned: assignments.length,
        totalCompleted: completed.length,
        completionRate:
          assignments.length > 0
            ? Math.round((completed.length / assignments.length) * 100)
            : 0,
        starsEarned,
      };
    });

    return success({
      weeklyStats,
      recentRedemptions: totalRedemptions,
      recentTransactions,
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return unauthorized(e.message);
    }
    console.error("Stats error:", e);
    return error("Failed to fetch stats", 500);
  }
}
