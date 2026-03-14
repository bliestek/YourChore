"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "@/hooks/useFetch";
import { rewardEmojis, resolveRewardEmoji } from "@/lib/icons";
import StarJar from "@/components/StarJar";

interface UserData {
  id: string;
  name: string;
  avatar: string;
  starBalance: number;
  role: "child";
}

interface Reward {
  id: string;
  title: string;
  icon: string;
  starCost: number;
  isEnabled: boolean;
}

export default function StarJarPage() {
  const [starBalance, setStarBalance] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [userData, rewardsData] = await Promise.all([
      api<UserData>("/api/auth/me"),
      api<Reward[]>("/api/rewards"),
    ]);

    if (userData.data) {
      setStarBalance(userData.data.starBalance);
    }
    if (rewardsData.data) {
      setRewards(rewardsData.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for star updates from other pages
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

  const cheapestReward = rewards.length > 0
    ? Math.min(...rewards.map((r) => r.starCost))
    : 10;

  // Max stars for jar = the most expensive reward or at least a reasonable amount
  const maxStarsForJar = rewards.length > 0
    ? Math.max(...rewards.map((r) => r.starCost), starBalance)
    : Math.max(20, starBalance);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-5xl"
        >
          {"\u2B50"}
        </motion.div>
        <p className="font-display font-bold text-xl text-white/80">
          Loading your stars...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.h1
        className="text-3xl font-display font-extrabold text-white text-center drop-shadow-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        My Star Jar
      </motion.h1>

      {/* Star Jar - the hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="flex justify-center py-4"
      >
        <StarJar
          starCount={starBalance}
          maxStars={maxStarsForJar}
          size="lg"
        />
      </motion.div>

      {/* Motivational message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        {starBalance === 0 ? (
          <p className="font-display font-bold text-lg text-white/80">
            Do chores to earn stars!
          </p>
        ) : starBalance >= cheapestReward ? (
          <motion.p
            className="font-display font-bold text-lg text-white"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            You can get a reward! Check the Rewards page!
          </motion.p>
        ) : (
          <p className="font-display font-bold text-lg text-white/80">
            Keep going! You are doing great!
          </p>
        )}
      </motion.div>

      {/* Progress toward rewards */}
      {rewards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <h2 className="font-display font-bold text-lg text-white/70 px-2">
            Rewards Progress
          </h2>

          {rewards.map((reward, index) => {
            const progress = Math.min(
              (starBalance / reward.starCost) * 100,
              100
            );
            const canAfford = starBalance >= reward.starCost;

            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`bg-white/90 rounded-2xl p-4 shadow-md ${
                  canAfford ? "border-3 border-green-400" : ""
                }`}
                style={canAfford ? { borderWidth: 3 } : {}}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">
                    {resolveRewardEmoji(reward.icon)}
                  </span>
                  <span className="font-display font-bold text-gray-800 flex-1 truncate">
                    {reward.title}
                  </span>
                  <span className="font-display font-bold text-sm text-gray-500">
                    {starBalance}/{reward.starCost} {"\u2B50"}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      canAfford
                        ? "bg-gradient-to-r from-green-400 to-green-500"
                        : "bg-gradient-to-r from-yellow-400 to-orange-400"
                    }`}
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.6 + index * 0.1 }}
                  />
                </div>

                {canAfford ? (
                  <p className="font-display font-bold text-green-600 text-sm mt-2 text-center">
                    Ready to claim!
                  </p>
                ) : (
                  <p className="font-display font-semibold text-gray-400 text-sm mt-2 text-center">
                    {reward.starCost - starBalance} more{" "}
                    {reward.starCost - starBalance === 1 ? "star" : "stars"}{" "}
                    needed
                  </p>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {rewards.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/70 rounded-2xl p-6 text-center"
        >
          <p className="font-display font-bold text-gray-500">
            No rewards available yet. Ask your parent to add some!
          </p>
        </motion.div>
      )}
    </div>
  );
}
