import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, error, unauthorized } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return unauthorized();

    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return error("Missing subscription data");
    }

    // Upsert by endpoint (unique)
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: session.id,
        role: session.role,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      create: {
        userId: session.id,
        role: session.role,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return success({ subscribed: true });
  } catch (e) {
    console.error("Push subscribe error:", e);
    return error("Failed to save subscription", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return unauthorized();

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return error("Missing endpoint");
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: session.id },
    });

    return success({ unsubscribed: true });
  } catch (e) {
    console.error("Push unsubscribe error:", e);
    return error("Failed to remove subscription", 500);
  }
}
