import { useEffect, useState, useRef } from "react";
import { Character } from "../lib/github";
import { BattleState, initializeBattle, simulateTurn } from "../lib/gameEngine";

interface BattleViewProps {
  player: Character;
  opponent: Character;
  onReset: () => void;
}

export default function BattleView({ player, opponent, onReset }: BattleViewProps) {
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initialize Battle on Mount
  useEffect(() => {
    setBattleState(initializeBattle(player, opponent));
  }, [player, opponent]);

  // 2. Auto-Play Turns every 1 second
  useEffect(() => {
    if (!battleState || battleState.winner) return;

    const timer = setInterval(() => {
      setBattleState((prev) => {
        if (!prev || prev.winner) return prev;
        return simulateTurn(prev, player, opponent);
      });
    }, 1000); // Speed of turns (1000ms = 1 second)

    return () => clearInterval(timer);
  }, [battleState, player, opponent]);

  // 3. Auto-scroll logs to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [battleState?.logs]);

  if (!battleState) return <div className="text-white">Loading Arena...</div>;

  // Calculate Max HP for Health Bars
  const pMaxHp = Math.floor(Math.log10(player.stats.hp + 1) * 20 + 5) * 10;
  const oMaxHp = Math.floor(Math.log10(opponent.stats.hp + 1) * 20 + 5) * 10;

  return (
    <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden flex flex-col">
      
      {/* HEADER */}
      <div className="bg-black p-4 flex justify-between items-center border-b border-zinc-800">
        <h2 className="text-xl font-bold text-white">BATTLE IN PROGRESS</h2>
        <span className="text-zinc-500 font-mono">Turn {battleState.turn}</span>
      </div>

      {/* FIGHTERS */}
      <div className="flex justify-between p-8 items-center bg-zinc-900">
        
        {/* PLAYER */}
        <div className="text-center w-1/3">
          <img 
            src={player.avatar} 
            alt={player.username} // <--- FIXED: Added alt text
            className="w-20 h-20 rounded-full border-4 border-indigo-500 mx-auto mb-2 shadow-[0_0_20px_rgba(99,102,241,0.5)]" 
          />
          <h3 className="text-white font-bold">{player.username}</h3>
          
          {/* Health Bar */}
          <div className="w-full bg-gray-700 h-4 rounded-full mt-2 overflow-hidden border border-gray-600">
            <div 
              className="bg-green-500 h-full transition-all duration-500"
              style={{ width: `${Math.max((battleState.playerHp / pMaxHp) * 100, 0)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{battleState.playerHp} / {pMaxHp} HP</p>
        </div>

        {/* VS LOGO */}
        <div className="text-4xl font-black italic text-zinc-700 animate-pulse">VS</div>

        {/* OPPONENT */}
        <div className="text-center w-1/3">
          <img 
            src={opponent.avatar} 
            alt={opponent.username} // <--- FIXED: Added alt text
            className="w-20 h-20 rounded-full border-4 border-red-500 mx-auto mb-2 shadow-[0_0_20px_rgba(239,68,68,0.5)]" 
          />
          <h3 className="text-white font-bold">{opponent.username}</h3>
           
          {/* Health Bar */}
          <div className="w-full bg-gray-700 h-4 rounded-full mt-2 overflow-hidden border border-gray-600">
            <div 
              className="bg-red-500 h-full transition-all duration-500"
              style={{ width: `${Math.max((battleState.opponentHp / oMaxHp) * 100, 0)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{battleState.opponentHp} / {oMaxHp} HP</p>
        </div>
      </div>

      {/* COMBAT LOG */}
      <div 
        ref={scrollRef}
        className="bg-black p-4 h-48 overflow-y-auto font-mono text-sm space-y-2 border-t border-zinc-800"
      >
        {battleState.logs.map((log, i) => (
          <div key={i} className={`
            ${log.includes("You hit") ? "text-green-400" : ""}
            ${log.includes("hits you") ? "text-red-400" : ""}
            ${log.includes("VICTORY") ? "text-yellow-400 font-bold text-lg text-center my-4" : ""}
            ${log.includes("DEFEAT") ? "text-red-600 font-bold text-lg text-center my-4" : ""}
          `}>
            {log}
          </div>
        ))}
      </div>

      {/* RESET BUTTON (Only shows when game ends) */}
      {battleState.winner && (
        <button 
          onClick={onReset}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 transition-colors"
        >
          PLAY AGAIN
        </button>
      )}
    </div>
  );
}