"use client";

import { Suspense, useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/hooks/useFetch";

function JoinFamilyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data } = await api<{ role: string }>("/api/auth/me");
      setIsLoggedIn(!!data);
    }
    checkAuth();

    const code = searchParams.get("code");
    if (code) setInviteCode(code);
  }, [searchParams]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.error("Please enter an invite code");
      return;
    }

    if (!isLoggedIn) {
      router.push(`/login?join=${encodeURIComponent(inviteCode.trim())}`);
      return;
    }

    setJoining(true);
    const { data, error } = await api<{ message: string; familyName: string }>(
      "/api/family/join",
      {
        method: "POST",
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      }
    );

    if (error) {
      toast.error(error);
      setJoining(false);
      return;
    }

    if (data) {
      toast.success(`Joined ${data.familyName}!`);
      router.push("/parent");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
            Join a Family
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Enter the invite code shared by another parent to join their family
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleJoin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. A1B2C3D4"
                className="input text-center text-xl font-mono font-bold tracking-widest"
                maxLength={8}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={joining || !inviteCode.trim()}
              className="btn-primary w-full text-lg py-3"
            >
              {joining ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Joining...
                </span>
              ) : isLoggedIn ? (
                "Join Family"
              ) : (
                "Log in & Join"
              )}
            </button>
          </form>

          {isLoggedIn === false && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              You&apos;ll be redirected to log in first, then automatically join the family.
            </p>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Don&apos;t have an account?{" "}
              <a
                href={`/register${inviteCode ? `?join=${encodeURIComponent(inviteCode)}` : ""}`}
                className="text-primary-500 hover:text-primary-600 font-medium"
              >
                Sign up
              </a>
            </p>
          </div>
        </div>

        <div className="text-center mt-4">
          <a
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ← Back to Home
          </a>
        </div>
      </motion.div>
    </div>
  );
}

export default function JoinFamilyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
        </div>
      }
    >
      <JoinFamilyForm />
    </Suspense>
  );
}
