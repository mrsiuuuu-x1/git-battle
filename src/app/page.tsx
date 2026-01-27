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
  
  // Data Fetched
  const [battleData, setBattleData] = useState<{ p1: Character; p2: Character } | null>(null);
  
  // Battle Started 
  const [battleStarted, setBattleStarted] = useState(false);

  const handleFetchData = async () => {
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

  const handleStartBattle = () => {
    setBattleStarted(true);
  };

  const handleReset = () => {
    setBattleData(null);
    setBattleStarted(false);
    setP1Name("");
    setP2Name("");
    setError("");
  };

  return (
    <main className="min-h-screen retro-grid-bg flex flex-col items-center justify-center p-4 retro-font overflow-hidden text-white relative">

      {/* BATTLE ARENA */}
      {battleData && battleStarted ? (
        <div className="w-full max-w-6xl animate-in fade-in zoom-in duration-500 z-10">
          <BattleView 
            player={battleData.p1} 
            opponent={battleData.p2} 
            onReset={handleReset} 
          />
        </div>
      ) : battleData ? (
        
        /* STATS PREVIEW */
        <div className="w-full max-w-5xl flex flex-col items-center animate-in zoom-in duration-300 z-20">
            <h2 className="text-3xl md:text-5xl mb-8 text-[#fcee09] drop-shadow-[4px_4px_0_#000]">MATCHUP FOUND</h2>
            
            <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full">
                
                {/* Player 1 Card */}
                <div className="bg-white/10 border-4 border-black p-6 pixel-shadow w-full md:w-1/3 flex flex-col items-center relative group hover:bg-white/20 transition-all">
                    <div className="absolute -top-4 bg-[#ffd700] text-black px-2 py-1 border-2 border-black text-xs">YOU</div>
                    <img alt="P1" src={battleData.p1.avatar} className="w-32 h-32 rounded-full border-4 border-black mb-4 bg-white" />
                    <h3 className="text-xl mb-2">{battleData.p1.username}</h3>
                    <div className="text-xs space-y-2 w-full text-left bg-black/40 p-4 border-2 border-black">
                        <div className="flex justify-between"><span>CLASS:</span> <span className="text-[#4ecdc4]">{battleData.p1.class}</span></div>
                        <div className="flex justify-between"><span>HP:</span> <div className="bg-green-600"><span>{battleData.p1.stats.hp}</span></div></div>
                        <div className="flex justify-between"><span>ATK:</span> <div className="bg-red-600"><span>{battleData.p1.stats.attack}</span></div></div>
                        <div className="flex justify-between"><span>SPD:</span> <div className="bg-yellow-600"><span>{battleData.p1.stats.speed}</span></div></div>
                    </div>
                </div>

                {/* VS Badge */}
                <div className="text-5xl font-bold text-white drop-shadow-[4px_4px_0_#000] animate-pulse">VS</div>

                {/* Player 2 Card */}
                <div className="bg-white/10 border-4 border-black p-6 pixel-shadow w-full md:w-1/3 flex flex-col items-center relative group hover:bg-white/20 transition-all">
                    <div className="absolute -top-4 bg-[#ff6b6b] text-white px-2 py-1 border-2 border-black text-xs">ENEMY</div>
                    <img alt="P2" src={battleData.p2.avatar} className="w-32 h-32 rounded-full border-4 border-black mb-4 bg-white" />
                    <h3 className="text-xl mb-2">{battleData.p2.username}</h3>
                    <div className="text-xs space-y-2 w-full text-left bg-black/40 p-4 border-2 border-black">
                        <div className="flex justify-between"><span>CLASS:</span> <span className="text-[#ff6b6b]">{battleData.p2.class}</span></div>
                        <div className="flex justify-between"><span>HP:</span> <div className="bg-green-600"><span>{battleData.p2.stats.hp}</span></div></div>
                        <div className="flex justify-between"><span>ATK:</span> <div className="bg-red-600"><span>{battleData.p2.stats.attack}</span></div></div>
                        <div className="flex justify-between"><span>SPD:</span> <div className="bg-yellow-600"><span>{battleData.p2.stats.speed}</span></div></div>
                    </div>
                </div>
            </div>

            <div className="flex gap-16 mt-10">
                <button 
                    onClick={handleReset}
                    className="bg-gray-500 text-white px-8 py-4 border-4 border-black pixel-shadow hover:bg-gray-600"
                >
                    CANCEL
                </button>
                <button 
                    onClick={handleStartBattle}
                    className="bg-[#ff6b6b] text-white px-10 py-4 text-xl border-4 border-black pixel-shadow hover:translate-y-1 hover:bg-red-600 transition-all animate-bounce flex items-center justify-center gap-2"
                >
                    FIGHT! <PixelSword className="w-8 h-8" />
                </button>
            </div>
        </div>

      ) : (
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
                onClick={handleFetchData}
                disabled={loading}
                className={`w-full bg-[#4ecdc4] text-white text-lg py-5 border-4 border-black pixel-shadow hover:-translate-y-1 hover:shadow-[8px_8px_0px_#000] active:translate-y-1 active:shadow-none transition-all duration-100 flex justify-center items-center gap-3
                  ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-[#45b7af]"}`}
              >
                {loading ? "LOADING..." : <>GET STATS <PixelSword className="w-9 h-9" /></>}
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}