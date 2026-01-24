"use client";

import { useState } from "react";
import { getCharacterProfile, Character } from "./lib/github";
import BattleView from "./components/BattleView";
import { PixelSword, PixelShield, PixelCrossedSwords } from "./components/PixelIcons"; 

export default function Home() {
  const [p1Name, setP1Name] = useState("");
  const [p2Name, setP2Name] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [battleData, setBattleData] = useState<{ p1: Character; p2: Character } | null>(null);

  const handleStart = async () => {
    if (!p1Name || !p2Name) {
      setError("Please enter both usernames!");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const [p1, p2] = await Promise.all([
        getCharacterProfile(p1Name),
        getCharacterProfile(p2Name),
      ]);

      if (!p1 || !p2) {
        setError("Could not find one of the users!");
        setLoading(false);
        return;
      }

      setBattleData({ p1, p2 });
    } catch (e) {
      setError("Error fetching data. Try again.");
    }
    setLoading(false);
  };

  const handleReset = () => {
    setBattleData(null);
    setP1Name("");
    setP2Name("");
    setError("");
  };

  return (
    <main className="min-h-screen retro-grid-bg flex flex-col items-center justify-center p-4 retro-font overflow-hidden text-white">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .retro-font { font-family: 'Press Start 2P', monospace; }
        .pixel-shadow { box-shadow: 6px 6px 0px rgba(0,0,0,1); }
        .pixel-input { box-shadow: inset 4px 4px 0px rgba(0,0,0,0.1); }
      `}</style>

      {battleData ? (
        // --- BATTLE VIEW SECTION ---
        // The floating swords are NOT here, so they will disappear!
        <div className="w-full max-w-6xl animate-in fade-in zoom-in duration-500 z-10">
          <button 
            onClick={handleReset} 
            className="absolute top-4 left-4 bg-white text-black border-4 border-black px-4 py-2 text-xs hover:bg-gray-200 pixel-shadow z-50"
          >
            ← BACK
          </button>
          <BattleView 
            player={battleData.p1} 
            opponent={battleData.p2} 
            onReset={handleReset} 
          />
        </div>
      ) : (
        // --- LANDING PAGE SECTION ---
        <>
          <div className="absolute top-10 left-10 text-white/20 animate-bounce">
            <PixelSword className="w-16 h-16" />
          </div>
          <div className="absolute bottom-10 right-10 text-white/20 animate-bounce delay-700">
            <PixelShield className="w-16 h-16" />
          </div>

          <div className="w-full max-w-lg bg-[#2d00f7]/80 backdrop-blur-sm border-4 border-black p-8 md:p-12 text-center pixel-shadow relative z-10">
            
            <div className="flex justify-center items-center gap-4 mb-8">
              <PixelCrossedSwords className="w-20 h-16 text-[#fcee09] animate-pulse" />
              <h1 className="text-3xl md:text-4xl text-white leading-relaxed drop-shadow-[4px_4px_0_#000]">
                GIT BATTLE
              </h1>
              <PixelCrossedSwords className="w-20 h-16 text-[#fcee09] animate-pulse" />
            </div>

            <div className="space-y-6">
              <div className="text-left">
                <label className="text-[#ffd700] text-xs mb-2 block text-shadow-[2px_2px_0_#000]">PLAYER 1 (YOU)</label>
                <input
                  type="text"
                  value={p1Name}
                  onChange={(e) => setP1Name(e.target.value)}
                  placeholder="github-username"
                  className="w-full bg-white border-4 border-black p-4 text-sm text-black outline-none focus:bg-yellow-50 pixel-input placeholder:text-gray-400"
                />
              </div>

              <div className="text-white text-xl font-bold py-2 drop-shadow-[2px_2px_0_#000]">- VS -</div>

              <div className="text-left">
                <label className="text-[#ff6b6b] text-xs mb-2 block text-shadow-[2px_2px_0_#000]">OPPONENT</label>
                <input
                  type="text"
                  value={p2Name}
                  onChange={(e) => setP2Name(e.target.value)}
                  placeholder="github-username"
                  className="w-full bg-white border-4 border-black p-4 text-sm text-black outline-none focus:bg-red-50 pixel-input placeholder:text-gray-400"
                />
              </div>

              {error && (
                <div className="bg-[#ff6b6b] text-white text-xs p-3 border-4 border-black animate-shake">
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleStart}
                disabled={loading}
                className={`w-full bg-[#4ecdc4] text-white text-lg py-5 border-4 border-black pixel-shadow hover:-translate-y-1 hover:shadow-[8px_8px_0px_#000] active:translate-y-1 active:shadow-none transition-all duration-100 flex justify-center items-center gap-3
                  ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-[#45b7af]"}`}
              >
                {loading ? "LOADING..." : <>START BATTLE <PixelSword className="w-9 h-9" /></>}
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}