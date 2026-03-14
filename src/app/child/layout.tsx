"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/hooks/useFetch";
import { getAvatarEmoji } from "@/lib/icons";
import toast from "react-hot-toast";
import PinModal from "@/components/PinModal";
import NotificationBanner from "@/components/NotificationBanner";

interface ChildUser {
  id: string;
  name: string;
  avatar: string;
  starBalance: number;
  role: "child";
  parentMode?: boolean;
}

interface SiblingChild {
  id: string;
  name: string;
  avatar: string;
  starBalance: number;
  hasPin: boolean;
}

export default function ChildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<ChildUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [siblings, setSiblings] = useState<SiblingChild[]>([]);
  const [pinModal, setPinModal] = useState<{ child: SiblingChild; error?: string } | null>(null);
  const [switching, setSwitching] = useState(false);

  const fetchUser = useCallback(async () => {
    const { data, error } = await api<ChildUser>("/api/auth/me");
    if (error || !data || data.role !== "child") {
      router.replace("/");
      return;
    }
    setUser(data);
    setLoading(false);
  }, [router]);

  const fetchSiblings = useCallback(async () => {
    const { data } = await api<SiblingChild[]>("/api/children");
    if (data) setSiblings(data);
  }, []);

  useEffect(() => {
    fetchUser();
    fetchSiblings();
  }, [fetchUser, fetchSiblings]);

  // Listen for star balance updates from child pages
  useEffect(() => {
    const handler = (e: CustomEvent<{ starBalance: number }>) => {
      setUser((prev) =>
        prev ? { ...prev, starBalance: e.detail.starBalance } : prev
      );
    };
    window.addEventListener(
      "star-update" as string,
      handler as EventListener
    );
    return () =>
      window.removeEventListener(
        "star-update" as string,
        handler as EventListener
      );
  }, []);

  const handleLogout = async () => {
    await api("/api/auth/logout", { method: "POST" });
    toast.success("Bye bye! See you soon!");
    router.replace("/");
  };

  const handleBackToParent = async () => {
    const { error } = await api("/api/auth/back-to-parent", { method: "POST" });
    if (error) {
      toast.error("Failed to switch back");
      return;
    }
    // Full navigation to pick up restored parent cookie
    window.location.href = "/parent";
  };

  const handleSwitchChild = async (child: SiblingChild, pin?: string) => {
    if (child.id === user?.id) return;

    // If not in parentMode and child has PIN and no pin provided, show modal
    if (!user?.parentMode && child.hasPin && !pin) {
      setPinModal({ child });
      return;
    }

    setSwitching(true);
    const { error } = await api("/api/auth/switch-child", {
      method: "POST",
      body: JSON.stringify({ childId: child.id, pin }),
    });

    if (error) {
      if (error.includes("Wrong PIN")) {
        setPinModal({ child, error: "Wrong PIN, try again" });
        setSwitching(false);
        return;
      }
      toast.error(error);
      setSwitching(false);
      return;
    }

    setPinModal(null);
    // Full reload to reset all child page state
    window.location.href = "/child";
  };

  const navItems = [
    { path: "/child", label: "My Chores", emoji: "\u2728", exact: true },
    { path: "/child/jar", label: "Star Jar", emoji: "\u2B50", exact: false },
    { path: "/child/rewards", label: "Rewards", emoji: "\uD83C\uDF81", exact: false },
  ];

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) return pathname === item.path;
    return pathname.startsWith(item.path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-orange-300 to-pink-300 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-7xl"
        >
          {"\u2B50"}
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  const otherSiblings = siblings.filter((s) => s.id !== user.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-orange-300 to-pink-300 flex flex-col">
      {/* Parent Mode Banner */}
      {user.parentMode && (
        <div className="bg-primary-600 text-white px-4 py-2 flex items-center justify-between z-50">
          <span className="text-sm font-medium">
            Viewing as <strong>{user.name}</strong>
          </span>
          <button
            onClick={handleBackToParent}
            className="text-sm font-bold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
          >
            Back to Parent
          </button>
        </div>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-md px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {/* Avatar + Name */}
          <div className="flex items-center gap-3">
            <motion.div
              className="text-4xl"
              whileTap={{ scale: 1.3, rotate: 15 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {getAvatarEmoji(user.avatar)}
            </motion.div>
            <span className="font-display font-bold text-xl text-gray-800 truncate max-w-[120px]">
              {user.name}
            </span>
          </div>

          {/* Star count */}
          <motion.div
            className="flex items-center gap-2 bg-yellow-100 rounded-full px-4 py-2 shadow-sm border-2 border-yellow-300"
            key={user.starBalance}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <span className="text-2xl">{"\u2B50"}</span>
            <span className="font-display font-extrabold text-xl text-yellow-700">
              {user.starBalance}
            </span>
          </motion.div>

          {/* Logout / Back */}
          {user.parentMode ? (
            <button
              onClick={handleBackToParent}
              className="text-gray-400 hover:text-gray-600 text-sm font-medium px-2 py-1 rounded-lg hover:bg-white/50 transition-colors"
            >
              Exit
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600 text-sm font-medium px-2 py-1 rounded-lg hover:bg-white/50 transition-colors"
            >
              Bye!
            </button>
          )}
        </div>

        {/* Child Switcher */}
        {otherSiblings.length > 0 && (
          <div className="max-w-lg mx-auto mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium shrink-0">Switch:</span>
            <div className="flex gap-1.5 overflow-x-auto">
              {otherSiblings.map((sibling) => (
                <button
                  key={sibling.id}
                  onClick={() => handleSwitchChild(sibling)}
                  disabled={switching}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white/60 hover:bg-white/90 rounded-full transition-all shrink-0 border border-white/50"
                >
                  <span className="text-lg">{getAvatarEmoji(sibling.avatar)}</span>
                  <span className="text-xs font-bold text-gray-600">{sibling.name}</span>
                  {sibling.hasPin && !user.parentMode && (
                    <span className="text-xs">🔒</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-28 px-4 pt-4">
        <div className="max-w-lg mx-auto">
          <NotificationBanner variant="child" />
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t-2 border-orange-200">
        <div className="flex items-stretch justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`touch-target flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-all duration-200 relative ${
                  active ? "text-orange-600" : "text-gray-400"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-orange-500 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.span
                  className="text-3xl"
                  animate={active ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {item.emoji}
                </motion.span>
                <span
                  className={`text-xs font-display font-bold ${
                    active ? "text-orange-600" : "text-gray-400"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Safe area spacer for phones with home indicators */}
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </nav>

      {/* PIN Modal */}
      {pinModal && (
        <PinModal
          childName={pinModal.child.name}
          error={pinModal.error}
          onSubmit={(pin) => handleSwitchChild(pinModal.child, pin)}
          onCancel={() => setPinModal(null)}
        />
      )}

      {/* Switching overlay */}
      {switching && (
        <div className="fixed inset-0 z-[90] bg-white/60 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="text-5xl"
          >
            {"\u2B50"}
          </motion.div>
        </div>
      )}
    </div>
  );
}
