"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { api } from "@/hooks/useFetch";
import { getAvatarEmoji, choreEmojis } from "@/lib/icons";
import { formatDate } from "@/lib/dates";

type Child = {
  id: string;
  name: string;
  avatar: string;
  starBalance: number;
};

type AssignmentChore = {
  id: string;
  title: string;
  icon: string;
  starValue: number;
  isShared?: boolean;
};

type ChildAssignment = {
  id: string;
  status: string;
  chore: AssignmentChore;
  child: { id: string; name: string; avatar: string };
};

type WeeklyStat = {
  child: Child;
  totalAssigned: number;
  totalCompleted: number;
  completionRate: number;
  starsEarned: number;
};

type Transaction = {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
  child: { name: string; avatar: string };
};

type StatsData = {
  weeklyStats: WeeklyStat[];
  recentTransactions: Transaction[];
};

export default function ParentDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedChild, setExpandedChild] = useState<string | null>(null);
  const [childAssignments, setChildAssignments] = useState<Record<string, ChildAssignment[]>>({});
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [statsRes, childrenRes] = await Promise.all([
      api<StatsData>("/api/stats"),
      api<Child[]>("/api/children"),
    ]);
    if (statsRes.data) setStats(statsRes.data);
    if (childrenRes.data) setChildren(childrenRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleGenerateAssignments() {
    setGenerating(true);
    const { data, error } = await api<{ message: string; created: string[] }>(
      "/api/assignments/generate",
      { method: "POST", body: JSON.stringify({}) }
    );
    setGenerating(false);
    if (error) {
      toast.error(error);
      return;
    }
    if (data) {
      toast.success(data.message);
      fetchData();
    }
  }

  async function handleViewAsChild(childId: string) {
    const { error } = await api("/api/auth/view-as-child", {
      method: "POST",
      body: JSON.stringify({ childId }),
    });
    if (error) {
      toast.error(error);
      return;
    }
    // Full navigation to pick up the new cookie
    window.location.href = "/child";
  }

  async function toggleChildChores(childId: string) {
    if (expandedChild === childId) {
      setExpandedChild(null);
      return;
    }
    setExpandedChild(childId);
    if (!childAssignments[childId]) {
      const { data } = await api<ChildAssignment[]>(`/api/assignments?childId=${childId}`);
      if (data) {
        setChildAssignments((prev) => ({ ...prev, [childId]: data }));
      }
    }
  }

  async function handleRemoveAssignment(assignmentId: string, childId: string) {
    setRemovingId(assignmentId);
    const { error } = await api(`/api/assignments/${assignmentId}`, {
      method: "DELETE",
    });
    if (error) {
      toast.error("Failed to remove chore");
    } else {
      setChildAssignments((prev) => ({
        ...prev,
        [childId]: (prev[childId] || []).filter((a) => a.id !== assignmentId),
      }));
      toast.success("Chore removed");
      // Refresh stats to update the counts
      const { data } = await api<StatsData>("/api/stats");
      if (data) setStats(data);
    }
    setRemovingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    );
  }

  const today = new Date();
  const greeting = today.getHours() < 12 ? "Good morning" : today.getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white">
            {greeting}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here&apos;s how your family is doing this week.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleGenerateAssignments}
            disabled={generating}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {generating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Generate Today&apos;s Chores
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {children.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center py-12"
        >
          <div className="text-5xl mb-4">&#128106;</div>
          <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2">
            Welcome to YourChore!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Start by adding your children, then create some chores and rewards.
          </p>
          <a href="/parent/children" className="btn-primary inline-block">
            Add Your First Child
          </a>
        </motion.div>
      ) : (
        <>
          {/* Weekly stats per child */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {stats?.weeklyStats.map((stat, i) => (
              <motion.div
                key={stat.child.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card-hover"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-2xl">
                    {getAvatarEmoji(stat.child.avatar)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-gray-900 dark:text-white truncate">
                      {stat.child.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stat.child.starBalance} stars
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {stat.completionRate}%
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">complete</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>
                      {stat.totalCompleted} of {stat.totalAssigned} chores
                    </span>
                    <span>{stat.starsEarned} stars earned</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.completionRate}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.1 + 0.3 }}
                      className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
                    />
                  </div>
                </div>

                {/* Today's Chores expand/collapse */}
                <button
                  onClick={() => toggleChildChores(stat.child.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors mb-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Today&apos;s Chores
                  <svg
                    className={`w-3 h-3 transition-transform ${expandedChild === stat.child.id ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {expandedChild === stat.child.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mb-2"
                    >
                      {(childAssignments[stat.child.id] || []).length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">
                          No chores assigned today
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {(childAssignments[stat.child.id] || []).map((a) => (
                            <div
                              key={a.id}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                a.status !== "pending"
                                  ? "bg-green-50 dark:bg-green-900/20"
                                  : "bg-gray-50 dark:bg-slate-700/30"
                              }`}
                            >
                              <span className="text-lg flex-shrink-0">
                                {choreEmojis[a.chore.icon] || "\u2728"}
                              </span>
                              <span
                                className={`flex-1 truncate ${
                                  a.status !== "pending"
                                    ? "line-through text-gray-400 dark:text-gray-500"
                                    : "text-gray-700 dark:text-gray-200"
                                }`}
                              >
                                {a.chore.title}
                                {a.chore.isShared && (
                                  <span className="ml-1.5 text-xs text-purple-500 dark:text-purple-400 font-medium">
                                    {"\uD83D\uDC65"}
                                  </span>
                                )}
                              </span>
                              {a.status !== "pending" ? (
                                <span className="text-green-500 text-base">&#x2705;</span>
                              ) : (
                                <button
                                  onClick={() => handleRemoveAssignment(a.id, stat.child.id)}
                                  disabled={removingId === a.id}
                                  className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-500 flex-shrink-0 transition-colors disabled:opacity-50"
                                  title="Remove this chore"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Kid View button */}
                <button
                  onClick={() => handleViewAsChild(stat.child.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Kid View
                </button>
              </motion.div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.a
              href="/parent/chores"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card-hover flex items-center gap-4 cursor-pointer group"
            >
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                <span>&#9989;</span>
              </div>
              <div>
                <h3 className="font-display font-semibold text-gray-900 dark:text-white">Manage Chores</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Create and assign chores</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.a>

            <motion.a
              href="/parent/rewards"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card-hover flex items-center gap-4 cursor-pointer group"
            >
              <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                <span>&#127873;</span>
              </div>
              <div>
                <h3 className="font-display font-semibold text-gray-900 dark:text-white">Manage Rewards</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Set up rewards for stars</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.a>
          </div>

          {/* Recent activity */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h2>
            {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
              <div className="card divide-y divide-gray-100 dark:divide-slate-700">
                {stats.recentTransactions.slice(0, 10).map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg bg-gray-50 dark:bg-slate-700">
                      {getAvatarEmoji(tx.child.avatar)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {tx.child.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {tx.description}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`text-sm font-bold ${
                          tx.amount > 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-500 dark:text-red-400"
                        }`}
                      >
                        {tx.amount > 0 ? "+" : ""}
                        {tx.amount} stars
                      </span>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(new Date(tx.createdAt))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No activity yet. Assign some chores to get started!</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
