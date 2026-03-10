import { NextRequest } from "next/server";
import { getSessionFromRequest, requireParent } from "@/lib/auth";
import { success, error, unauthorized } from "@/lib/api";
import { generateDailyAssignments } from "@/lib/chores";

// Generate today's assignments from recurring chores
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    requireParent(session);

    const { childId, date: dateStr } = await request.json();
    const date = dateStr ? new Date(dateStr) : undefined;

    const created = await generateDailyAssignments(session!.familyId, {
      childId,
      date,
    });

    return success({
      message: `Generated ${created.length} assignments`,
      created,
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return unauthorized(e.message);
    }
    console.error("Generate assignments error:", e);
    return error("Failed to generate assignments", 500);
  }
}
