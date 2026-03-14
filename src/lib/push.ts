import webpush from "web-push";
import { prisma } from "@/lib/db";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  // VAPID subject must be mailto: or https: URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const subject = appUrl.startsWith("https://")
    ? appUrl
    : "mailto:noreply@yourchore.app";

  webpush.setVapidDetails(subject, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  vapidConfigured = true;
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

/**
 * Send push notification to all subscriptions for a given user.
 * Auto-cleans expired subscriptions (410 Gone).
 * Never throws — failures are logged silently.
 */
async function sendPushToUser(userId: string, role: string, payload: PushPayload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  ensureVapidConfigured();

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId, role },
    });

    if (subscriptions.length === 0) return;

    const message = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icons/icon-192.png",
      url: payload.url || "/",
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            message
          );
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 410 || statusCode === 404) {
            // Subscription expired — clean up
            await prisma.pushSubscription.delete({
              where: { id: sub.id },
            }).catch(() => {});
          }
          throw err;
        }
      })
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.log(`Push: ${results.length - failed.length}/${results.length} sent to ${role}:${userId}`);
    }
  } catch (err) {
    console.error("Push notification error:", err);
  }
}

/**
 * Notify all parents in a family (e.g., when a child completes a chore).
 */
export async function notifyParentsInFamily(familyId: string, payload: PushPayload) {
  try {
    const members = await prisma.familyMember.findMany({
      where: { familyId },
      select: { userId: true },
    });

    await Promise.allSettled(
      members.map((m) => sendPushToUser(m.userId, "parent", payload))
    );
  } catch (err) {
    console.error("Notify parents error:", err);
  }
}

/**
 * Notify a specific child (e.g., when a parent approves a chore).
 */
export async function notifyChild(childId: string, payload: PushPayload) {
  await sendPushToUser(childId, "child", payload);
}
