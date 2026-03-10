import { NextRequest } from "next/server";
import { getSessionFromRequest, requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, error, unauthorized } from "@/lib/api";
import { startOfDay, endOfDay, isToday } from "@/lib/dates";
import { generateDailyAssignments } from "@/lib/chores";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");
  const dateStr = searchParams.get("date");
  const status = searchParams.get("status");

  const date = dateStr ? new Date(dateStr) : new Date();

  // Auto-generate today's chores if the family has it enabled
  if (isToday(date)) {
    const family = await prisma.family.findUnique({
      where: { id: session.familyId },
      select: { autoGenerateChores: true },
    });
    if (family?.autoGenerateChores) {
      await generateDailyAssignments(session.familyId);
    }
  }

  const where: Record<string, unknown> = {};

  if (childId) {
    where.childId = childId;
  } else if (session.role === "child") {
    where.childId = session.id;
  }

  if (status) {
    where.status = status;
  } else {
    // Always exclude dismissed assignments unless a specific status is requested
    where.status = { not: "dismissed" };
  }

  // Default: show today's assignments
  where.dueDate = {
    gte: startOfDay(date),
    lte: endOfDay(date),
  };

  const assignments = await prisma.choreAssignment.findMany({
    where,
    include: {
      chore: {
        select: {
          id: true,
          title: true,
          description: true,
          icon: true,
          starValue: true,
          isShared: true,
        },
      },
      child: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return success(assignments);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    requireParent(session);

    const { choreId, childId, dueDate } = await request.json();

    if (!choreId || !childId) {
      return error("Chore ID and Child ID are required");
    }

    // Verify the chore and child belong to this parent
    const [chore, child] = await Promise.all([
      prisma.chore.findUnique({ where: { id: choreId } }),
      prisma.child.findUnique({ where: { id: childId } }),
    ]);

    if (!chore || chore.familyId !== session!.familyId) {
      return error("Chore not found");
    }
    if (!child || child.familyId !== session!.familyId) {
      return error("Child not found");
    }

    const assignment = await prisma.choreAssignment.create({
      data: {
        choreId,
        childId,
        dueDate: dueDate ? new Date(dueDate) : new Date(),
      },
      include: {
        chore: {
          select: {
            id: true,
            title: true,
            icon: true,
            starValue: true,
          },
        },
      },
    });

    return success(assignment, 201);
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return unauthorized(e.message);
    }
    console.error("Create assignment error:", e);
    return error("Failed to create assignment", 500);
  }
}
