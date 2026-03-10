"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { api } from "@/hooks/useFetch";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinCode = searchParams.get("join");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Welcome to YourChore!");

    // If we came from a join flow, redirect to join with the code
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
          {joinCode ? "Create Account & Join Family" : "Create Family Account"}
        </h1>

        {joinCode && (
          <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-xl px-4 py-3 mb-4 text-center">
            Create an account to join a family with code <span className="font-mono font-bold">{joinCode}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Your Name</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mum, Dad, Sarah"
              required
            />
          </div>

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
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-lg py-3"
          >
            {loading ? "Creating..." : joinCode ? "Create Account & Join" : "Create Account"}
          </button>
        </form>

        <p className="text-center mt-4 text-gray-500">
          Already have an account?{" "}
          <Link
            href={joinCode ? `/login?join=${encodeURIComponent(joinCode)}` : "/login"}
            className="text-primary-500 font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
