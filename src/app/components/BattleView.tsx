import { useEffect, useState, useRef } from "react";
import { Character } from "../lib/github";
import { BattleState, initializeBattle, performPlayerTurn, performOpponentTurn } from "../lib/gameEngine";
import { PixelShield, PixelSword, PixelCrossedSwords } from "./PixelIcons";

interface BattleViewProps {
  player: Character;
  opponent: Character;
  onReset: () => void;
}

export default function BattleView({ player, opponent, onReset }: BattleViewProps) {
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Animation States
  const [p1Anim, setP1Anim] = useState("");
  const [p2Anim, setP2Anim] = useState("");

  // 1. Initialize Battle
  useEffect(() => {
    setBattleState(initializeBattle(player, opponent));
  }, [player, opponent]);

  // 2. Handle Enemy Turn (Auto)
  useEffect(() => {
    if (battleState && !battleState.winner && !battleState.isPlayerTurn) {
      const timer = setTimeout(() => {
        setBattleState((prev) => {
          if (!prev) return null;
          const newState = performOpponentTurn(prev, player, opponent);
          // Trigger Animations
          setP2Anim("attacking"); 
          setTimeout(() => setP1Anim("damaged"), 250); 
          setTimeout(() => { setP2Anim(""); setP1Anim(""); }, 600);
          return newState;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [battleState, player, opponent]);

  // 3. Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [battleState?.logs]);

  if (!battleState) return <div className="text-white text-center p-10 font-mono">LOADING BATTLE...</div>;

  const handleAction = (action: "attack" | "heal") => {
    if (action === "attack") {
      setP1Anim("attacking"); 
      setTimeout(() => setP2Anim("damaged"), 250); 
      setTimeout(() => { setP1Anim(""); setP2Anim(""); }, 600);
    }
    setBattleState((prev) => prev ? performPlayerTurn(prev, player, opponent, action) : null);
  };

  const healsLeft = 3 - battleState.playerHealsUsed;
  const isHealDisabled = !battleState.isPlayerTurn || battleState.playerHealCd > 0 || healsLeft <= 0;
  
  let healButtonText = "MERGE SHIELD";
  if (healsLeft <= 0) healButtonText = "EMPTY";
  else if (battleState.playerHealCd > 0) healButtonText = `WAIT (${battleState.playerHealCd})`;
  else healButtonText = `SHIELD (${healsLeft})`;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] font-mono flex flex-col items-center py-10 relative overflow-hidden">
      

      {/* HEADER */}
      <div className="flex justify-center items-center gap-7 mb-10">
        <PixelCrossedSwords className="w-16 h-16 md:h-16 text-[#fcee09] animate-pulse"/>
        <h1 className="retro-font text-3xl md:text-5xl text-white text-center drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
          GIT BATTLE
        </h1>
        <PixelCrossedSwords className="w-16 h-16 md:h-16 text-[#fcee09] animate-pulse" />
      </div>
      

      <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center px-4 gap-8">
        
        {/* PLAYER 1 CARD */}
        <div className={`retro-font w-full md:w-1/3 bg-white/10 border-4 border-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,0.3)] relative transition-transform ${p1Anim === "attacking" ? "attacking-right" : ""} ${p1Anim === "damaged" ? "damaged bg-red-500/30" : ""}`}>
          <div className="flex flex-col items-center">
            <img 
              src={player.avatar} 
              alt={player.username}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-black mb-4 bg-white"
            />
            <h2 className="text-lg md:text-xl text-white mb-2">{player.username}</h2>
            <span className="bg-[#ffd700] text-black text-[10px] px-2 py-1 border-2 border-black mb-4">
              {player.class}
            </span>
            
            {/* HP BAR */}
            <div className="w-full">
              <div className="text-[10px] text-white mb-1 flex justify-between">
                <span>HP</span>
                <span>{battleState.playerHp}/{battleState.playerMaxHp}</span>
              </div>
              <div className="w-full h-6 bg-black/50 border-2 border-black relative">
                <div 
                  className="h-full transition-all duration-500"
                  style={{ 
                    width: `${(battleState.playerHp / battleState.playerMaxHp) * 100}%`,
                    background: battleState.playerHp < (battleState.playerMaxHp * 0.3) 
                      ? 'linear-gradient(90deg, #ff6b6b, #c92a2a)' 
                      : 'linear-gradient(90deg, #4ecdc4, #44a39b)' 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* VS TEXT */}
        <div className="retro-font text-5xl text-white drop-shadow-[6px_6px_0px_rgba(0,0,0,0.5)] animate-pulse">
          VS
        </div>

        {/* PLAYER 2 CARD */}
        <div className={`retro-font w-full md:w-1/3 bg-white/10 border-4 border-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,0.3)] relative transition-transform ${p2Anim === "attacking" ? "attacking-left" : ""} ${p2Anim === "damaged" ? "damaged bg-red-500/30" : ""}`}>
          <div className="flex flex-col items-center">
            <img 
              src={opponent.avatar} 
              alt={opponent.username}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-black mb-4 bg-white"
            />
            <h2 className="text-lg md:text-xl text-white mb-2">{opponent.username}</h2>
            <span className="bg-[#ffd700] text-black text-[10px] px-2 py-1 border-2 border-black mb-4">
              {opponent.class}
            </span>
            
            {/* HP BAR */}
            <div className="w-full">
              <div className="text-[10px] text-white mb-1 flex justify-between">
                <span>HP</span>
                <span>{battleState.opponentHp}/{battleState.opponentMaxHp}</span>
              </div>
              <div className="w-full h-6 bg-black/50 border-2 border-black relative">
                <div 
                  className="h-full transition-all duration-500"
                  style={{ 
                    width: `${(battleState.opponentHp / battleState.opponentMaxHp) * 100}%`,
                    background: battleState.opponentHp < (battleState.opponentMaxHp * 0.3) 
                      ? 'linear-gradient(90deg, #ff6b6b, #c92a2a)' 
                      : 'linear-gradient(90deg, #ff9f43, #ee5253)' 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* LOGS */}
      <div className="w-full max-w-4xl px-4 mt-8">
        <div ref={scrollRef} className="retro-font text-xs bg-black/40 border-4 border-black p-4 h-40 overflow-y-auto shadow-inner space-y-2">
          {battleState.logs.map((log, i) => {
            let logStyle = "border-[#ffd700] text-gray-300";
            if (log.includes("hits") || log.includes("DMG")) {
              logStyle = "border-[#ff6b6b] text-[#ff6b6b] bg-red-900/20";
            }
            else if (log.includes("Shield") || log.includes("patches")) {
              logStyle = "border-[#4ecdc4] text-[4ecdc4] bg-green-900/20";
            }
            else if (log.includes("CRITICAL")) {
              logStyle = "border-orange-500 text-orange-400 font-bold bg-orange-900/20";
            }
            return (
              <div key={i} className={`p-2 border-l-4 ${logStyle}`}>
                {log}
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="w-full max-w-md px-4 mt-8 flex flex-col gap-4 z-20">
        {battleState.winner ? (
          <button 
            onClick={onReset}
            className="retro-font w-full bg-[#ff6b6b] text-white py-4 text-xl border-4 border-black shadow-[6px_6px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all"
          >
            PLAY AGAIN
          </button>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={() => handleAction("attack")}
              disabled={!battleState.isPlayerTurn}
              className="retro-font flex-1 bg-[#ff6b6b] text-white py-4 text-xs md:text-sm border-4 border-black shadow-[6px_6px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0px_#000] hover:bg-red-600 active:translate-x-1.5 active:translate-y-1.5 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <PixelSword className="w-8 h-8"/> ATTACK
            </button>
            <button
              onClick={() => handleAction("heal")}
              disabled={isHealDisabled}
              className={`retro-font flex-1 text-white py-4 text-xs md:text-sm border-4 border-black shadow-[6px_6px_0px_#000] transition-all flex items-center justify-center gap-2
                ${isHealDisabled 
                  ? "bg-gray-500 opacity-50 cursor-not-allowed shadow-none translate-x-0.5 translate-y-0.5" 
                  : "bg-[#4ecdc4] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0px_#000] hover:bg-cyan-600 active:translate-x-1.5 active:translate-y-1.5 active:shadow-none"
                }`}
            >
              <PixelShield className="w-8 h-8"/> {healButtonText}
            </button>
          </div>
        )}
      </div>

      {/* WINNER BANNER OVERLAY */}
      {battleState.winner && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in duration-500">
           <div className="bg-[#ffd700] border-4 border-black p-8 text-center shadow-[0_0_50px_rgba(255,215,0,0.5)] transform scale-100 animate-in zoom-in duration-300">
             <h2 className="retro-font text-3xl md:text-5xl text-black mb-4">🏆 VICTORY!</h2>
             <p className="retro-font text-black mb-8">{battleState.winner === "player" ? "YOU WON!" : "YOU LOST..."}</p>
             <button onClick={onReset} className="retro-font bg-[#ff6b6b] text-white py-4 px-8 border-4 border-black shadow-[6px_6px_0px_#000] hover:shadow-[4px_4px_0px_#000] active:shadow-none transition-all">
               PLAY AGAIN
             </button>
           </div>
        </div>
      )}

    </div>
  );
}