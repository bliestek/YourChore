"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StarJarProps {
  starCount: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
}

interface FloatingStar {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

const SIZE_MAP = {
  sm: { height: 160, width: 120, fontSize: "text-3xl", starSize: 14 },
  md: { height: 240, width: 180, fontSize: "text-4xl", starSize: 18 },
  lg: { height: 340, width: 240, fontSize: "text-5xl", starSize: 22 },
};

export default function StarJar({
  starCount,
  maxStars = 20,
  size = "lg",
}: StarJarProps) {
  const [animatedFill, setAnimatedFill] = useState(0);
  const dims = SIZE_MAP[size];

  const fillPercent = Math.min((starCount / Math.max(maxStars, 1)) * 100, 100);

  useEffect(() => {
    // Animate fill level change
    const timer = setTimeout(() => {
      setAnimatedFill(fillPercent);
    }, 100);
    return () => clearTimeout(timer);
  }, [fillPercent]);

  // Generate floating star particles inside the filled area
  const floatingStars: FloatingStar[] = useMemo(() => {
    const count = Math.min(starCount, 15);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80, // percentage within jar
      y: 5 + Math.random() * (Math.min(fillPercent, 95) * 0.85), // within filled area
      size: dims.starSize * (0.6 + Math.random() * 0.6),
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
    }));
  }, [starCount, fillPercent, dims.starSize]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Star count display */}
      <motion.div
        className={`${dims.fontSize} font-display font-extrabold text-yellow-500 drop-shadow-md`}
        key={starCount}
        initial={{ scale: 1.4, color: "#FFD700" }}
        animate={{ scale: 1, color: "#EAB308" }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      >
        {starCount} {"\u2B50"}
      </motion.div>

      {/* Jar container */}
      <div
        className="relative"
        style={{ width: dims.width, height: dims.height }}
      >
        {/* Jar glow effect */}
        <div
          className="absolute inset-0 rounded-3xl animate-glow"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,215,0,0.15), transparent 70%)",
            transform: "scale(1.15)",
          }}
        />

        {/* Jar body */}
        <div
          className="relative w-full h-full overflow-hidden"
          style={{
            borderRadius: "16px 16px 32px 32px",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.05))",
            border: "3px solid rgba(255,215,0,0.4)",
            boxShadow:
              "inset 0 0 40px rgba(255,255,255,0.15), 0 0 20px rgba(255,215,0,0.15), inset -8px 0 20px rgba(255,255,255,0.1)",
            backdropFilter: "blur(4px)",
          }}
        >
          {/* Jar lip / rim */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 z-10"
            style={{
              width: dims.width + 16,
              height: 18,
              borderRadius: "8px 8px 4px 4px",
              background:
                "linear-gradient(180deg, rgba(255,215,0,0.6), rgba(255,165,0,0.5))",
              border: "2px solid rgba(255,215,0,0.5)",
              boxShadow: "0 2px 8px rgba(255,215,0,0.3)",
              top: -2,
            }}
          />

          {/* Fill level */}
          <motion.div
            className="absolute bottom-0 left-0 right-0"
            initial={{ height: "0%" }}
            animate={{ height: `${animatedFill}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              background:
                "linear-gradient(to top, rgba(255,215,0,0.5), rgba(255,215,0,0.3), rgba(255,215,0,0.1))",
              borderTop: "2px solid rgba(255,215,0,0.3)",
            }}
          >
            {/* Shimmer on top of fill */}
            <div
              className="absolute top-0 left-0 right-0 h-4"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.4), transparent)",
              }}
            />
          </motion.div>

          {/* Floating stars inside the jar */}
          <AnimatePresence>
            {floatingStars.map((star) => (
              <motion.div
                key={star.id}
                className="absolute"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0.6, 1, 0.6],
                  scale: [0.8, 1, 0.8],
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: star.duration,
                  delay: star.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  left: `${star.x}%`,
                  bottom: `${star.y}%`,
                  fontSize: star.size,
                  filter: "drop-shadow(0 0 4px rgba(255,215,0,0.6))",
                }}
              >
                {"\u2B50"}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Glass shine overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(105deg, rgba(255,255,255,0.3) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
