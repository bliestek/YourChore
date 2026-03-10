import { NextRequest } from "next/server";
import { getSessionFromRequest, requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, error, unauthorized, notFound } from "@/lib/api";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return unauthorized();

    // Only parents (or parentMode) can remove assignments
    if (session.role === "child" && !(session as { parentMode?: boolean }).parentMode) {
      return unauthorized("Only parents can remove assignments");
    }

    const { id } = params;

    const assignment = await prisma.choreAssignment.findUnique({
      where: { id },
      include: { chore: { select: { familyId: true } } },
    });

    if (!assignment) return notFound("Assignment not found");

    // Verify same family
    if (assignment.chore.familyId !== session.familyId) {
      return unauthorized();
    }

    await prisma.choreAssignment.delete({ where: { id } });

    return success({ message: "Assignment removed" });
  } catch (e) {
    console.error("Delete assignment error:", e);
    return error("Failed to remove assignment", 500);
  }
}
