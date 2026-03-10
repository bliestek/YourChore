"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/hooks/useFetch";
import { rewardEmojis } from "@/lib/icons";
import Confetti from "@/components/Confetti";
import toast from "react-hot-toast";

interface Reward {
  id: string;
  title: string;
  description: string;
  icon: string;
  starCost: number;
  isEnabled: boolean;
}

interface UserData {
  id: string;
  name: string;
  avatar: string;
  starBalance: number;
  role: "child";
}

interface RedeemResponse {
  message: string;
  starBalance: number;
}

export default function ChildRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [starBalance, setStarBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebrateReward, setCelebrateReward] = useState<Reward | null>(null);

  const fetchData = useCallback(async () => {
    const [rewardsData, userData] = await Promise.all([
      api<Reward[]>("/api/rewards"),
      api<UserData>("/api/auth/me"),
    ]);

    if (rewardsData.data) {
      setRewards(rewardsData.data);
    }
    if (userData.data) {
      setStarBalance(userData.data.starBalance);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for star updates
  useEffect(() => {
    const handler = (e: CustomEvent<{ starBalance: number }>) => {
      setStarBalance(e.detail.starBalance);
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

  const handleRedeem = async (reward: Reward) => {
    if (redeemingId || starBalance < reward.starCost) return;
    setRedeemingId(reward.id);

    const { data, error } = await api<RedeemResponse>(
      `/api/rewards/${reward.id}/redeem`,
      { method: "POST" }
    );

    if (error) {
      toast.error("Oops! Could not claim reward.");
      setRedeemingId(null);
      return;
    }

    if (data) {
      // Big celebration!
      setStarBalance(data.starBalance);
      setCelebrateReward(reward);
      setShowConfetti(true);

      // Notify layout about star update
      window.dispatchEvent(
        new CustomEvent("star-update", {
          detail: { starBalance: data.starBalance },
        })
      );

      toast.success("Reward claimed!", {
        icon: "\uD83C\uDF89",
        style: {
          fontSize: "18px",
          fontWeight: "bold",
          background: "#ECFDF5",
          border: "2px solid #34D399",
        },
      });

      // Clean up celebration after delay
      setTimeout(() => {
        setShowConfetti(false);
        setCelebrateReward(null);
      }, 4000);
    }

    setRedeemingId(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-5xl"
        >
          {"\uD83C\uDF81"}
        </motion.div>
        <p className="font-display font-bold text-xl text-white/80">
          Loading rewards...
        </p>
      </div>
    );
  }

  return (
    <>
      <Confetti active={showConfetti} duration={4000} />

      {/* Full-screen celebration overlay */}
      <AnimatePresence>
        {celebrateReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setCelebrateReward(null);
              setShowConfetti(false);
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 12,
              }}
              className="bg-white rounded-3xl p-10 text-center shadow-2xl max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className="text-8xl mb-4"
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [0, 15, -15, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatDelay: 0.5,
                }}
              >
                {rewardEmojis[celebrateReward.icon] || "\uD83C\uDF81"}
              </motion.div>

              <motion.h2
                className="font-display font-extrabold text-3xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 mb-3"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                YOU DID IT!
              </motion.h2>

              <p className="font-display font-bold text-xl text-gray-700 mb-2">
                {celebrateReward.title}
              </p>

              <p className="font-display text-gray-400 mb-6">
                Ask your parent about your reward!
              </p>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setCelebrateReward(null);
                  setShowConfetti(false);
                }}
                className="btn-kid bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
              >
                Yay!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {/* Header */}
        <motion.h1
          className="text-3xl font-display font-extrabold text-white text-center drop-shadow-md"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Rewards
        </motion.h1>

        {/* Current balance reminder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 rounded-2xl px-5 py-3 text-center shadow-md"
        >
          <span className="font-display font-bold text-gray-600">
            You have{" "}
          </span>
          <span className="font-display font-extrabold text-xl text-yellow-600">
            {starBalance} {"\u2B50"}
          </span>
        </motion.div>

        {/* Rewards grid */}
        {rewards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/70 rounded-2xl p-8 text-center"
          >
            <div className="text-5xl mb-4">{"\uD83C\uDF81"}</div>
            <p className="font-display font-bold text-lg text-gray-500">
              No rewards yet. Ask your parent to add some!
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {rewards.map((reward, index) => {
              const canAfford = starBalance >= reward.starCost;
              const starsNeeded = reward.starCost - starBalance;

              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`rounded-3xl p-5 shadow-lg transition-all ${
                    canAfford
                      ? "bg-white border-green-400"
                      : "bg-white/60"
                  }`}
                  style={
                    canAfford
                      ? { borderWidth: 3, borderColor: "#4ade80", borderStyle: "solid" }
                      : { opacity: 0.75 }
                  }
                >
                  <div className="flex items-center gap-4">
                    {/* Reward emoji */}
                    <motion.div
                      className={`text-5xl flex-shrink-0 ${
                        !canAfford ? "grayscale-[30%]" : ""
                      }`}
                      animate={
                        canAfford
                          ? { scale: [1, 1.1, 1] }
                          : {}
                      }
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {rewardEmojis[reward.icon] || "\uD83C\uDF81"}
                    </motion.div>

                    {/* Reward info */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-display font-extrabold text-xl truncate ${
                          canAfford ? "text-gray-800" : "text-gray-500"
                        }`}
                      >
                        {reward.title}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-lg">{"\u2B50"}</span>
                        <span
                          className={`font-display font-bold text-lg ${
                            canAfford
                              ? "text-yellow-600"
                              : "text-gray-400"
                          }`}
                        >
                          {reward.starCost}{" "}
                          {reward.starCost === 1 ? "star" : "stars"}
                        </span>
                      </div>
                    </div>

                    {/* Action area */}
                    <div className="flex-shrink-0">
                      {canAfford ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRedeem(reward)}
                          disabled={redeemingId === reward.id}
                          className="btn-kid bg-gradient-to-r from-green-400 to-green-600 text-white animate-glow disabled:opacity-50"
                        >
                          {redeemingId === reward.id ? (
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="inline-block"
                            >
                              {"\u2B50"}
                            </motion.span>
                          ) : (
                            "Claim!"
                          )}
                        </motion.button>
                      ) : (
                        <div className="text-center px-2">
                          <p className="font-display font-bold text-sm text-gray-400">
                            {starsNeeded} more
                          </p>
                          <p className="font-display font-bold text-xs text-gray-300">
                            {starsNeeded === 1 ? "star" : "stars"} needed
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
