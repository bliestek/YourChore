import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, getDayName } from "@/lib/dates";

/**
 * Generate today's assignments from recurring chores for a family.
 * Idempotent — skips chores that already have assignments for the given date.
 * Returns the list of newly created assignment descriptions.
 */
export async function generateDailyAssignments(
  familyId: string,
  options?: { childId?: string; date?: Date }
): Promise<string[]> {
  const date = options?.date ?? new Date();
  const dayName = getDayName(date);

  const [chores, children] = await Promise.all([
    prisma.chore.findMany({
      where: {
        familyId,
        isActive: true,
        recurringType: { not: "none" },
      },
    }),
    prisma.child.findMany({
      where: {
        familyId,
        ...(options?.childId && { id: options.childId }),
      },
    }),
  ]);

  const created: string[] = [];

  for (const chore of chores) {
    if (chore.recurringType === "weekly" && chore.recurringDays) {
      const days = chore.recurringDays.split(",").map((d) => d.trim().toLowerCase());
      if (!days.includes(dayName)) continue;
    }

    for (const child of children) {
      const existing = await prisma.choreAssignment.findFirst({
        where: {
          choreId: chore.id,
          childId: child.id,
          dueDate: {
            gte: startOfDay(date),
            lte: endOfDay(date),
          },
        },
      });

      if (!existing) {
        await prisma.choreAssignment.create({
          data: {
            choreId: chore.id,
            childId: child.id,
            dueDate: startOfDay(date),
          },
        });
        created.push(`${chore.title} -> ${child.name}`);
      }
    }
  }

  return created;
}
