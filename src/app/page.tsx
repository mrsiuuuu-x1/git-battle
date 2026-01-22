"use client";

import { useState } from "react";
import { fetchUserStats } from "./actions";
import { Character } from "./lib/github";
import UserCard from "./components/UserCard";
import BattleView from "./components/BattleView";

export default function Home() {
  // State for Player 1
  const [playerUsername, setPlayerUsername] = useState("");
  const [player, setPlayer] = useState<Character | null>(null);
  
  // State for Player 2 
  const [opponentUsername, setOpponentUsername] = useState("");
  const [opponent, setOpponent] = useState<Character | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [battleStarted, setBattleStarted] = useState(false);

  // fetch Data
  const handleSummon = async (username: string, isPlayer: boolean) => {
    if (!username) return;
    setLoading(true);
    setError("");

    try {
      const data = await fetchUserStats(username);
      if (data) {
        if (isPlayer) setPlayer(data);
        else setOpponent(data);
      } else {
        setError(`Could not find warrior: ${username}`);
      }
    } catch (err) {
      setError("Something went wrong. Check the console.");
    } finally {
      setLoading(false);
    }
  };

return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-8">
      
      <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 mb-12">
        GIT BATTLE
      </h1>

      {/* BATTLE STARTED -> SHOW ARENA */}
      {battleStarted && player && opponent ? (
        <BattleView 
          player={player} 
          opponent={opponent} 
          onReset={() => setBattleStarted(false)} 
        />
      ) : (
        // NO BATTLE -> SHOW SUMMONING SCREEN
        <>
          {/* Error Banner */}
          {error && (
            <div className="bg-red-900/50 text-red-200 px-6 py-3 rounded-lg mb-8 border border-red-800 animate-pulse">
              {error}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-12 items-center justify-center w-full max-w-6xl">
            
            {/* LEFT: PLAYER */}
            <div className="flex flex-col items-center gap-4">
              {!player ? (
                <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 w-80 text-center">
                  <h2 className="text-xl font-bold mb-4 text-indigo-400">Player 1</h2>
                  <div className="flex gap-2">
                    <input
                      className="bg-black border border-zinc-700 p-2 rounded w-full"
                      placeholder="Your Username"
                      value={playerUsername}
                      onChange={(e) => setPlayerUsername(e.target.value)}
                    />
                    <button 
                      onClick={() => handleSummon(playerUsername, true)}
                      disabled={loading}
                      className="bg-indigo-600 px-4 rounded font-bold hover:bg-indigo-500 disabled:opacity-50"
                    >
                      GO
                    </button>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in-left">
                  <p className="text-center text-indigo-400 font-bold mb-2">YOU</p>
                  <UserCard character={player} />
                  <button onClick={() => setPlayer(null)} className="mt-4 text-xs text-zinc-500 underline">Change</button>
                </div>
              )}
            </div>

            <div className="text-4xl font-black italic text-zinc-700">VS</div>

            {/* RIGHT: OPPONENT */}
            <div className="flex flex-col items-center gap-4">
              {!opponent ? (
                <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 w-80 text-center">
                  <h2 className="text-xl font-bold mb-4 text-red-400">Opponent</h2>
                  <div className="flex gap-2">
                    <input
                      className="bg-black border border-zinc-700 p-2 rounded w-full"
                      placeholder="Enemy Username"
                      value={opponentUsername}
                      onChange={(e) => setOpponentUsername(e.target.value)}
                    />
                    <button 
                      onClick={() => handleSummon(opponentUsername, false)}
                      disabled={loading}
                      className="bg-red-600 px-4 rounded font-bold hover:bg-red-500 disabled:opacity-50"
                    >
                      GO
                    </button>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in-right">
                  <p className="text-center text-red-400 font-bold mb-2">ENEMY</p>
                  <UserCard character={opponent} />
                  <button onClick={() => setOpponent(null)} className="mt-4 text-xs text-zinc-500 underline">Change</button>
                </div>
              )}
            </div>
          </div>

          {/* FIGHT BUTTON */}
          {player && opponent && (
            <div className="mt-12 animate-bounce">
              <button 
                className="bg-gradient-to-r from-red-600 to-orange-600 text-white text-2xl font-black py-4 px-12 rounded-full shadow-lg hover:scale-110 transition-transform border-4 border-orange-400"
                onClick={() => setBattleStarted(true)}
              >
                FIGHT!
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}