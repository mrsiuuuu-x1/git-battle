"use client";

import { useEffect, useState } from "react";
import { TierDef } from "../lib/tiers";

interface RankUpAnimationProps {
  oldTier: TierDef;
  newTier: TierDef;
  onComplete: () => void;
}

export default function RankUpAnimation({ oldTier, newTier, onComplete }: RankUpAnimationProps) {
  const [phase, setPhase] = useState<"flash" | "old" | "transform" | "new" | "done">("flash");

  // Deterministic pseudo-random particle positions based on index (avoids Math.random purity issues)
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    w: 4 + ((i * 7 + 3) % 9),
    left: ((i * 37 + 13) % 100),
    top: ((i * 53 + 7) % 100),
    dur: 1.5 + ((i * 11 + 5) % 20) / 10,
    delay: ((i * 17 + 3) % 5) / 10,
  }));

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("old"), 400),
      setTimeout(() => setPhase("transform"), 1800),
      setTimeout(() => setPhase("new"), 2800),
      setTimeout(() => setPhase("done"), 5500),
      setTimeout(() => onComplete(), 5800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      {/* Inject keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rankup-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rankup-scale-in {
          from { opacity: 0; transform: scale(0.3); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes rankup-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px) rotate(-1deg); }
          75% { transform: translateX(4px) rotate(1deg); }
        }
        @keyframes rankup-glow {
          from { filter: brightness(1.5) drop-shadow(0 0 20px ${newTier.color}); }
          to { filter: brightness(2.5) drop-shadow(0 0 40px ${newTier.color}); }
        }
        @keyframes rankup-particle {
          0% { opacity: 0; transform: scale(0) translateY(0); }
          20% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.5) translateY(-200px); }
        }
      `}} />

      {/* Background overlay */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{
          backgroundColor: phase === "flash" ? "white" : "rgba(0,0,0,0.92)",
        }}
      />

      {/* Particle effects */}
      {(phase === "new" || phase === "done") && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${p.w}px`,
                height: `${p.w}px`,
                backgroundColor: newTier.color,
                left: `${p.left}%`,
                top: `${p.top}%`,
                opacity: 0,
                animation: `rankup-particle ${p.dur}s ease-out ${p.delay}s forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* RANK UP text */}
        {phase === "flash" && (
          <div className="retro-font text-4xl md:text-6xl text-white animate-pulse">
            RANK UP!
          </div>
        )}

        {/* Old tier fading out */}
        {phase === "old" && (
          <div className="flex flex-col items-center gap-4" style={{ animation: "rankup-fade-in 0.5s ease-out forwards" }}>
            <p className="retro-font text-gray-400 text-sm tracking-widest">CURRENT RANK</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={oldTier.image}
              alt={oldTier.name}
              className="w-[250px] md:w-[290px]"
              style={{ filter: "brightness(0.7)" }}
            />
          </div>
        )}

        {/* Transform phase - shake + glow */}
        {phase === "transform" && (
          <div className="flex flex-col items-center gap-4" style={{ animation: "rankup-shake 0.15s ease-in-out infinite" }}>
            <p className="retro-font text-sm tracking-widest animate-pulse" style={{ color: newTier.color }}>
              EVOLVING...
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={oldTier.image}
              alt={oldTier.name}
              className="w-[250px] md:w-[290px]"
              style={{
                filter: `brightness(2) drop-shadow(0 0 30px ${newTier.color})`,
                animation: "rankup-glow 0.3s ease-in-out infinite alternate",
              }}
            />
          </div>
        )}

        {/* New tier reveal */}
        {(phase === "new" || phase === "done") && (
          <div className="flex flex-col items-center gap-4" style={{ animation: "rankup-scale-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}>
            <p className="retro-font text-sm tracking-widest" style={{ color: newTier.color }}>
              NEW RANK
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={newTier.image}
              alt={newTier.name}
              className="w-[270px] md:w-[320px]"
              style={{
                filter: `drop-shadow(0 0 20px ${newTier.color}) drop-shadow(0 0 40px ${newTier.color}40)`,
              }}
            />
            <div
              className="retro-font text-2xl md:text-4xl font-bold tracking-wider"
              style={{
                color: newTier.color,
                textShadow: `0 0 20px ${newTier.color}, 0 0 40px ${newTier.color}60`,
                animation: "rankup-fade-in 0.5s ease-out 0.3s both",
              }}
            >
              {newTier.name.toUpperCase()}
            </div>
            {phase === "done" && (
              <button
                onClick={onComplete}
                className="retro-font text-xs text-gray-500 hover:text-white mt-4 cursor-pointer transition-colors"
                style={{ animation: "rankup-fade-in 0.5s ease-out forwards" }}
              >
                TAP TO CONTINUE
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
