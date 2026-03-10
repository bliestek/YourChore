"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { api } from "@/hooks/useFetch";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinCode = searchParams.get("join");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }

    // If we came from a join flow, redirect back to join with the code
    if (joinCode) {
      router.push(`/join?code=${encodeURIComponent(joinCode)}`);
    } else {
      router.push("/parent");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-3xl font-display font-bold text-center mb-6">
          Parent Login
        </h1>

        {joinCode && (
          <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-xl px-4 py-3 mb-4 text-center">
            Log in to join a family with code <span className="font-mono font-bold">{joinCode}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
              required
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-lg py-3"
          >
            {loading ? "Signing in..." : joinCode ? "Sign In & Join Family" : "Sign In"}
          </button>
        </form>

        <div className="text-center mt-4 space-y-2">
          <p className="text-gray-500">
            No account?{" "}
            <Link
              href={joinCode ? `/register?join=${encodeURIComponent(joinCode)}` : "/register"}
              className="text-primary-500 font-semibold hover:underline"
            >
              Create one
            </Link>
          </p>
          <Link
            href="/"
            className="text-gray-400 hover:text-gray-500 text-sm inline-block"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
