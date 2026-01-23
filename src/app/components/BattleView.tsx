import { useEffect, useState, useRef } from "react";
import { Character } from "../lib/github";
import { BattleState, initializeBattle, performPlayerTurn, performOpponentTurn } from "../lib/gameEngine";

interface BattleViewProps {
  player: Character;
  opponent: Character;
  onReset: () => void;
}

export default function BattleView({ player, opponent, onReset }: BattleViewProps) {
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize Battle
  useEffect(() => {
    setBattleState(initializeBattle(player, opponent));
  }, [player, opponent]);

  // Handle Enemy Turn (Auto)
  useEffect(() => {
    if (battleState && !battleState.winner && !battleState.isPlayerTurn) {
      // Small delay so it feels like the enemy is thinking
      const timer = setTimeout(() => {
        setBattleState((prev) => prev ? performOpponentTurn(prev, player, opponent) : null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [battleState, player, opponent]);

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [battleState?.logs]);

  if (!battleState) return <div className="text-white">Loading Arena...</div>;

  const handleAction = (action: "attack" | "heal") => {
    setBattleState((prev) => prev ? performPlayerTurn(prev, player, opponent, action) : null);
  };

  // COOLDOWN AND HEALS LEFT LOGIC
  const healsLeft = 3 - battleState.playerHealsUsed;
  const isHealDisabled = !battleState.isPlayerTurn || battleState.playerHealCd > 0 || healsLeft <= 0;

  // Helper button text
  let healButtonText = "🛡️ MERGE SHIELD";
  if (healsLeft <= 0) healButtonText = "🛡️ EMPTY";
  else if (battleState.playerHealCd > 0) healButtonText = `🛡️ Wait (${battleState.playerHealCd})`;
  else healButtonText = `🛡️ MERGE SHIELD (${healsLeft})`;

  return (
    <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden flex flex-col shadow-2xl">
      
      {/* HEADER */}
      <div className="bg-black p-4 flex justify-between items-center border-b border-zinc-800">
        <h2 className="text-xl font-bold text-white">BATTLE ARENA</h2>
        <span className="text-zinc-500 font-mono">Turn {battleState.turn}</span>
      </div>

      {/* FIGHTERS */}
      <div className="flex justify-between p-8 items-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        
        {/* PLAYER */}
        <div className={`text-center w-1/3 transition-opacity ${!battleState.isPlayerTurn ? "opacity-50" : "opacity-100"}`}>
          <img 
            src={player.avatar} 
            alt={player.username}
            className="w-24 h-24 rounded-full border-4 border-indigo-500 mx-auto mb-4 shadow-[0_0_20px_rgba(99,102,241,0.5)]" 
          />
          <h3 className="text-white font-bold text-lg">{player.username}</h3>
          
          <div className="w-full bg-gray-800 h-4 rounded-full mt-2 overflow-hidden border border-gray-600 relative">
            <div 
              className="bg-green-500 h-full transition-all duration-500"
              style={{ width: `${(battleState.playerHp / battleState.playerMaxHp) * 100}%` }}
            />
            <span className="absolute inset-0 text-[10px] flex items-center justify-center font-bold text-white drop-shadow-md">
              {battleState.playerHp} / {battleState.playerMaxHp}
            </span>
          </div>
        </div>

        {/* VS */}
        <div className="text-5xl font-black italic text-zinc-800">VS</div>

        {/* OPPONENT */}
        <div className={`text-center w-1/3 transition-opacity ${battleState.isPlayerTurn ? "opacity-50" : "opacity-100"}`}>
          <img 
            src={opponent.avatar} 
            alt={opponent.username}
            className="w-24 h-24 rounded-full border-4 border-red-500 mx-auto mb-4 shadow-[0_0_20px_rgba(239,68,68,0.5)]" 
          />
          <h3 className="text-white font-bold text-lg">{opponent.username}</h3>
           
          <div className="w-full bg-gray-800 h-4 rounded-full mt-2 overflow-hidden border border-gray-600 relative">
            <div 
              className="bg-red-500 h-full transition-all duration-500"
              style={{ width: `${(battleState.opponentHp / battleState.opponentMaxHp) * 100}%` }}
            />
             <span className="absolute inset-0 text-[10px] flex items-center justify-center font-bold text-white drop-shadow-md">
              {battleState.opponentHp} / {battleState.opponentMaxHp}
            </span>
          </div>
        </div>
      </div>

      {/* LOGS */}
      <div 
        ref={scrollRef}
        className="bg-black/50 p-4 h-48 overflow-y-auto font-mono text-sm space-y-2 border-t border-zinc-800"
      >
        {battleState.logs.map((log, i) => (
          <div key={i} className={`
            ${log.includes("Commit Storm") ? "text-indigo-400" : ""}
            ${log.includes("Merge Shield") ? "text-green-400" : ""}
            ${log.includes("attacks you") ? "text-red-400" : ""}
            ${log.includes("VICTORY") ? "text-yellow-400 font-bold text-lg text-center my-4" : ""}
            ${log.includes("DEFEAT") ? "text-red-600 font-bold text-lg text-center my-4" : ""}
            ${log.includes("CRITICAL HIT") ? "text-orange-500 font-bold" : ""}
            ${log.includes("You are faster") ? "text-blue-400 italic" : ""}
            ${log.includes("No potions left") ? "text-red-500 font-bold" : ""}
          `}>
            {log}
          </div>
        ))}
      </div>

      {/* CONTROLS */}
      <div className="p-4 bg-zinc-900 border-t border-zinc-700">
        {battleState.winner ? (
          <button 
            onClick={onReset}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-lg transition-colors"
          >
            PLAY AGAIN
          </button>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={() => handleAction("attack")}
              disabled={!battleState.isPlayerTurn}
              className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-all border-b-4 border-red-800 active:border-b-0 active:translate-y-1"
            >
              ⚔️ COMMIT STORM
            </button>
            <button
              onClick={() => handleAction("heal")}
              disabled={isHealDisabled}
              className={`flex-1 text-white font-bold py-4 rounded-lg transition-all border-b-4 active:border-b-0 active:translate-y-1
                ${isHealDisabled 
                  ? "bg-zinc-600 border-zinc-800 opacity-50 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-500 border-green-800"
                }`}
            >
              {healButtonText}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}