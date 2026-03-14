"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/hooks/useFetch";
import { choreEmojis, resolveChoreEmoji } from "@/lib/icons";
import Confetti from "@/components/Confetti";
import toast from "react-hot-toast";

interface Chore {
  id: string;
  title: string;
  icon: string;
  starValue: number;
  isShared?: boolean;
}

interface Assignment {
  id: string;
  status: string;
  chore: Chore;
}

interface CompleteResponse {
  assignment: Assignment;
  starBalance: number;
  starsEarned: number;
}

interface FloatingStarAnim {
  id: string;
  count: number;
}

export default function ChildChoresPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [floatingStars, setFloatingStars] = useState<FloatingStarAnim[]>([]);
  const [celebrateId, setCelebrateId] = useState<string | null>(null);
  const fetchAssignments = useCallback(async () => {
    const { data } = await api<Assignment[]>("/api/assignments");
    if (data) {
      setAssignments(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleComplete = async (assignmentId: string) => {
    if (completingId) return;
    setCompletingId(assignmentId);

    const { data, error } = await api<CompleteResponse>(
      `/api/assignments/${assignmentId}/complete`,
      { method: "POST" }
    );

    if (error) {
      toast.error("Oops! Something went wrong.");
      setCompletingId(null);
      return;
    }

    if (data) {
      // Trigger celebration
      setCelebrateId(assignmentId);

      // Update the assignment status locally
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId
            ? { ...a, status: data.assignment.status }
            : a
        )
      );

      if (data.starsEarned > 0) {
        // Stars awarded immediately — full celebration
        setShowConfetti(true);
        setFloatingStars((prev) => [
          ...prev,
          { id: assignmentId, count: data.starsEarned },
        ]);

        window.dispatchEvent(
          new CustomEvent("star-update", {
            detail: { starBalance: data.starBalance },
          })
        );

        toast.success(`Awesome! +${data.starsEarned} stars!`, {
          icon: "\u2B50",
          style: {
            fontSize: "18px",
            fontWeight: "bold",
            background: "#FEF3C7",
            border: "2px solid #F59E0B",
          },
        });
      } else {
        // Needs parent approval — encouraging message, no confetti
        toast.success("Great job! Waiting for parent approval.", {
          icon: "\uD83D\uDC4D",
          style: {
            fontSize: "18px",
            fontWeight: "bold",
            background: "#EDE9FE",
            border: "2px solid #8B5CF6",
          },
        });
      }

      // Clean up animations after they finish
      setTimeout(() => {
        setShowConfetti(false);
        setCelebrateId(null);
        setFloatingStars((prev) =>
          prev.filter((s) => s.id !== assignmentId)
        );
      }, 3000);
    }

    setCompletingId(null);
  };

  const pendingChores = assignments.filter(
    (a) => a.status === "pending"
  );
  const doneChores = assignments.filter(
    (a) => a.status !== "pending"
  );
  const allDone = assignments.length > 0 && pendingChores.length === 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-5xl"
        >
          {"\u2728"}
        </motion.div>
        <p className="font-display font-bold text-xl text-white/80">
          Loading chores...
        </p>
      </div>
    );
  }

  return (
    <>
      <Confetti active={showConfetti} duration={3000} />

      <div className="space-y-4">
        {/* Header */}
        <motion.h1
          className="text-3xl font-display font-extrabold text-white text-center drop-shadow-md"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          My Chores Today
        </motion.h1>

        {/* All done message */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/90 rounded-3xl p-8 text-center shadow-xl border-4 border-green-300"
            >
              <motion.div
                className="text-7xl mb-4"
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {"\uD83C\uDF89"}
              </motion.div>
              <h2 className="font-display font-extrabold text-2xl text-green-600 mb-2">
                All Done! Great Job!
              </h2>
              <p className="font-display font-bold text-lg text-gray-500">
                You finished all your chores today!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* No chores assigned */}
        {assignments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 rounded-3xl p-8 text-center shadow-xl"
          >
            <div className="text-6xl mb-4">{"\uD83C\uDF1F"}</div>
            <h2 className="font-display font-extrabold text-2xl text-gray-700 mb-2">
              No Chores Today!
            </h2>
            <p className="font-display font-bold text-lg text-gray-400">
              Enjoy your free day!
            </p>
          </motion.div>
        )}

        {/* Pending chores */}
        <div className="space-y-4">
          {pendingChores.map((assignment, index) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <motion.div
                className={`bg-white rounded-3xl p-5 shadow-lg border-3 transition-colors ${
                  celebrateId === assignment.id
                    ? "border-green-400 bg-green-50"
                    : "border-white"
                }`}
                animate={
                  celebrateId === assignment.id
                    ? { scale: [1, 1.05, 1], borderColor: "#4ade80" }
                    : { scale: 1 }
                }
                transition={{ duration: 0.5 }}
                style={{ borderWidth: 3 }}
              >
                <div className="flex items-center gap-4">
                  {/* Chore emoji */}
                  <motion.div
                    className="text-5xl flex-shrink-0"
                    whileTap={{ scale: 1.3, rotate: 20 }}
                  >
                    {resolveChoreEmoji(assignment.chore.icon)}
                  </motion.div>

                  {/* Chore info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-extrabold text-xl text-gray-800 truncate">
                      {assignment.chore.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg">{"\u2B50"}</span>
                      <span className="font-display font-bold text-yellow-600 text-lg">
                        {assignment.chore.starValue}{" "}
                        {assignment.chore.starValue === 1 ? "star" : "stars"}
                      </span>
                      {assignment.chore.isShared && (
                        <span className="text-xs font-display font-bold text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full">
                          {"\uD83D\uDC65"} Shared
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Done button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleComplete(assignment.id)}
                    disabled={completingId === assignment.id}
                    className="btn-kid bg-green-500 hover:bg-green-600 text-white shadow-green-300 flex-shrink-0 disabled:opacity-50"
                  >
                    {completingId === assignment.id ? (
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
                      "Done!"
                    )}
                  </motion.button>
                </div>
              </motion.div>

              {/* Floating "+X stars" animation */}
              <AnimatePresence>
                {floatingStars.find((s) => s.id === assignment.id) && (
                  <motion.div
                    initial={{ opacity: 1, y: 0, scale: 1 }}
                    animate={{ opacity: 0, y: -80, scale: 1.5 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute top-0 right-8 pointer-events-none z-50"
                  >
                    <span className="font-display font-extrabold text-2xl text-yellow-500 drop-shadow-lg">
                      +
                      {
                        floatingStars.find((s) => s.id === assignment.id)
                          ?.count
                      }{" "}
                      {"\u2B50"}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Completed chores */}
        {doneChores.length > 0 && (
          <div className="mt-6">
            <h2 className="font-display font-bold text-lg text-white/70 mb-3 px-2">
              Finished
            </h2>
            <div className="space-y-3">
              {doneChores.map((assignment, index) => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/50 rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl opacity-50">
                      {resolveChoreEmoji(assignment.chore.icon)}
                    </span>
                    <span className="font-display font-bold text-lg text-gray-400 line-through flex-1 truncate">
                      {assignment.chore.title}
                    </span>
                    {assignment.status === "completed" ? (
                      <span className="text-xs font-display font-bold text-purple-500 bg-purple-100 px-2 py-1 rounded-full flex-shrink-0">
                        Pending approval
                      </span>
                    ) : (
                      <motion.span
                        className="text-3xl"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        }}
                      >
                        {"\u2705"}
                      </motion.span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
