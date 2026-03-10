"use client";

import { useEffect, useState } from "react";

interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  shape: "circle" | "square" | "star";
  rotation: number;
}

interface ConfettiProps {
  active: boolean;
  duration?: number;
}

const COLORS = [
  "#FF6B6B", // red
  "#FFD93D", // yellow
  "#6BCB77", // green
  "#4D96FF", // blue
  "#FF6BD6", // pink
  "#A66CFF", // purple
  "#FF9F43", // orange
  "#54E346", // lime
  "#FF4757", // crimson
  "#1DD1A1", // teal
  "#FECA57", // gold
  "#EE5A24", // vermillion
];

function createParticles(count: number): ConfettiParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 10 + 6,
    delay: Math.random() * 0.8,
    duration: Math.random() * 1.5 + 2,
    shape: (["circle", "square", "star"] as const)[
      Math.floor(Math.random() * 3)
    ],
    rotation: Math.random() * 360,
  }));
}

export default function Confetti({ active, duration = 3000 }: ConfettiProps) {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setParticles(createParticles(60));
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setParticles([]);
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      setParticles([]);
    }
  }, [active, duration]);

  if (!visible || particles.length === 0) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 9999 }}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: `${p.x}%`,
            top: -20,
            width: p.size,
            height: p.shape === "circle" ? p.size : p.size * 1.4,
            backgroundColor:
              p.shape !== "star" ? p.color : "transparent",
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        >
          {p.shape === "star" && (
            <span
              style={{
                fontSize: p.size * 1.5,
                color: p.color,
                lineHeight: 1,
              }}
            >
              {"\u2B50"}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
