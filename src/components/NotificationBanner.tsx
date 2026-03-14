"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface NotificationBannerProps {
  variant?: "parent" | "child";
}

export default function NotificationBanner({ variant = "parent" }: NotificationBannerProps) {
  const [show, setShow] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    // Don't show if no VAPID key configured
    if (!vapidKey) return;

    // Don't show if notifications not supported
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    // Don't show if already granted or denied
    if (Notification.permission !== "default") return;

    // Don't show if previously dismissed
    if (localStorage.getItem("push-dismissed") === "true") return;

    // Show after a short delay to not be intrusive
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, [vapidKey]);

  const handleEnable = async () => {
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setShow(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey!) as BufferSource,
      });

      const json = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      setShow(false);
    } catch (err) {
      console.error("Failed to subscribe:", err);
      setShow(false);
    } finally {
      setSubscribing(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("push-dismissed", "true");
    setShow(false);
  };

  const isChild = variant === "child";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.3 }}
          className={`overflow-hidden ${isChild ? "mx-auto max-w-lg" : ""}`}
        >
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-4 ${
              isChild
                ? "bg-white/90 shadow-lg border-2 border-orange-200"
                : "bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700"
            }`}
          >
            <span className="text-2xl flex-shrink-0">
              {isChild ? "\uD83D\uDD14" : "\uD83D\uDD14"}
            </span>
            <p
              className={`flex-1 text-sm font-medium ${
                isChild
                  ? "font-display font-bold text-gray-700"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {isChild
                ? "Get notified when you earn stars!"
                : "Get notified when chores are completed!"}
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleEnable}
                disabled={subscribing}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                  isChild
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "bg-primary-600 hover:bg-primary-700 text-white"
                }`}
              >
                {subscribing ? "..." : "Enable"}
              </button>
              <button
                onClick={handleDismiss}
                className={`px-2 py-1.5 rounded-lg text-sm transition-colors ${
                  isChild
                    ? "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                }`}
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
