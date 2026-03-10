"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/hooks/useFetch";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    api("/api/auth/me").then(({ data }) => {
      if (data && typeof data === "object" && "role" in data) {
        const d = data as { role: string };
        if (d.role === "parent") {
          router.replace("/parent");
        } else {
          router.replace("/child");
        }
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400">
        <div className="text-white text-2xl font-display font-bold animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex flex-col items-center justify-center p-4">
      {/* Logo and Title */}
      <div className="text-center mb-12">
        <div className="text-7xl mb-4">⭐</div>
        <h1 className="text-5xl md:text-6xl font-display font-extrabold text-white drop-shadow-lg mb-2">
          YourChore
        </h1>
        <p className="text-xl text-white/90 font-display">
          Do chores. Earn stars. Get rewards!
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={() => router.push("/login")}
          className="btn-kid bg-white text-purple-600 hover:bg-purple-50 text-center"
        >
          Parent Login
        </button>

        <button
          onClick={() => router.push("/child-select")}
          className="btn-kid bg-yellow-400 text-yellow-900 hover:bg-yellow-300 text-center"
        >
          I&apos;m a Kid! ⭐
        </button>

        <button
          onClick={() => router.push("/join")}
          className="btn-kid bg-green-400 text-green-900 hover:bg-green-300 text-center"
        >
          Join a Family 👨‍👩‍👧‍👦
        </button>

        <button
          onClick={() => router.push("/register")}
          className="text-white/80 hover:text-white font-display font-semibold text-lg transition-colors mt-4"
        >
          Create Family Account
        </button>
      </div>
    </div>
  );
}
