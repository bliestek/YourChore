"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { api } from "@/hooks/useFetch";
import { getAvatarEmoji } from "@/lib/icons";

type ChildProfile = {
  id: string;
  name: string;
  avatar: string;
  starBalance: number;
};

type FamilyCode = {
  email: string;
};

export default function ChildSelectPage() {
  const router = useRouter();
  const [step, setStep] = useState<"family" | "children" | "pin">("family");
  const [email, setEmail] = useState("");
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsPin, setNeedsPin] = useState(false);

  // Look up family by parent email
  async function lookupFamily(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Login temporarily to get children list
    // We use a special endpoint that doesn't require full auth
    const { data, error } = await api<ChildProfile[]>(
      `/api/family/children?email=${encodeURIComponent(email)}`
    );

    setLoading(false);
    if (error || !data) {
      toast.error("Family not found. Ask your parent for their email.");
      return;
    }
    setChildren(data);
    setStep("children");
  }

  async function selectChild(child: ChildProfile) {
    setSelectedChild(child);
    // Try logging in without a PIN first
    const { data, error } = await api<{ child: ChildProfile }>(
      "/api/auth/child-login",
      {
        method: "POST",
        body: JSON.stringify({ childId: child.id }),
      }
    );

    if (error?.includes("Wrong PIN")) {
      setNeedsPin(true);
      setStep("pin");
      return;
    }

    if (error) {
      toast.error(error);
      return;
    }

    router.push("/child");
  }

  async function submitPin(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChild) return;
    setLoading(true);

    const { error } = await api("/api/auth/child-login", {
      method: "POST",
      body: JSON.stringify({ childId: selectedChild.id, pin }),
    });

    setLoading(false);
    if (error) {
      toast.error("Wrong PIN! Try again.");
      setPin("");
      return;
    }

    router.push("/child");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-orange-300 to-pink-300 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Family lookup step */}
        {step === "family" && (
          <div className="text-center">
            <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
            <h1 className="text-3xl font-display font-bold text-white mb-6 drop-shadow">
              Find Your Family
            </h1>
            <form onSubmit={lookupFamily} className="card">
              <p className="text-gray-500 mb-4">
                Ask Mum or Dad for their email address
              </p>
              <input
                type="email"
                className="input text-lg text-center"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parent@email.com"
                required
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-kid bg-yellow-400 text-yellow-900 w-full mt-4"
              >
                {loading ? "Looking..." : "Find My Family"}
              </button>
            </form>
            <button
              onClick={() => router.push("/")}
              className="text-white/80 hover:text-white mt-4 font-display font-semibold"
            >
              Go Back
            </button>
          </div>
        )}

        {/* Child selection step */}
        {step === "children" && (
          <div className="text-center">
            <h1 className="text-3xl font-display font-bold text-white mb-6 drop-shadow">
              Who Are You?
            </h1>
            <div className="grid grid-cols-2 gap-4">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => selectChild(child)}
                  className="card-hover flex flex-col items-center gap-2 py-6 active:scale-95 transition-transform"
                >
                  <span className="text-5xl">
                    {getAvatarEmoji(child.avatar)}
                  </span>
                  <span className="font-display font-bold text-xl">
                    {child.name}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep("family")}
              className="text-white/80 hover:text-white mt-6 font-display font-semibold"
            >
              Go Back
            </button>
          </div>
        )}

        {/* PIN entry step */}
        {step === "pin" && selectedChild && (
          <div className="text-center">
            <div className="text-6xl mb-4">
              {getAvatarEmoji(selectedChild.avatar)}
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-2 drop-shadow">
              Hi {selectedChild.name}!
            </h1>
            <p className="text-white/80 font-display mb-6">
              Enter your secret PIN
            </p>
            <form onSubmit={submitPin} className="card">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                className="input text-4xl text-center tracking-[0.5em] font-mono"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="****"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || pin.length !== 4}
                className="btn-kid bg-green-400 text-green-900 w-full mt-4"
              >
                {loading ? "..." : "Go!"}
              </button>
            </form>
            <button
              onClick={() => {
                setStep("children");
                setPin("");
              }}
              className="text-white/80 hover:text-white mt-4 font-display font-semibold"
            >
              Not me? Go back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
