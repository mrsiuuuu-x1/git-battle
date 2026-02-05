"use client";

import { saveBattleResult, sendBattleMove, notifyOpponentLeft } from "../actions"; 
import { useEffect, useState, useRef } from "react";
import { playSound } from "../lib/sounds";
import { Character } from "../lib/github";
import { BattleState, initializeBattle, performPlayerTurn, performOpponentTurn } from "../lib/gameEngine";
import { PixelShield, PixelSword, PixelCrossedSwords } from "./PixelIcons";
import DamageNumber from "./DamageNumber";
import { pusherClient } from "../lib/pusher";

interface BattleViewProps {
  player: Character;
  opponent: Character;
  onReset: () => void;
  onMainMenu?: () => void; // 👈 New optional prop
  gameMode?: "pve" | "pvp";
  roomId?: string;
}

export default function BattleView({ player, opponent, onReset, onMainMenu, gameMode = "pve", roomId }: BattleViewProps) {
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // State for damage numbers
  const [damageNumbers, setDamageNumbers] = useState<Array<{id:number,value:string,x:number,y:number,color?:string}>>([]);
  const nextId = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMoveId = useRef<number>(0);

  const [p1Anim, setP1Anim] = useState("");
  const [p2Anim, setP2Anim] = useState("");


  // Check for Winner
  useEffect(() => {
    if (battleState?.winner) {
      if (battleState.winner === "player") {
        playSound("win");
      } else {
        playSound("gameover");
      }
      saveBattleResult(
        player.username,
        player.avatar,
        battleState.winner === "player" ? "WIN" : "LOSS",
        opponent.username
      );
    }
  }, [battleState?.winner]);

  // Spawning numbers
  const spawnNumber = (value: string, target: "player" | "opponent", type: "damage" | "heal") => {
    const id = nextId.current++;
    const direction = id % 2 === 0 ? -1 : 1; 
    const xOffset = direction * 10;
    const x = (target === "player" ? 25 : 75) + xOffset;
    const slot = id % 4;
    const y = 15 + (slot * 10); 
    const color = type === "damage" ? "#ff6b6b" : "#4ecdc4";
    setDamageNumbers(prev => [...prev, { id, value, x, y, color }]);
  };

  const handleDamageComplete = (id: number) => {
    setDamageNumbers(prev => prev.filter(n => n.id !== id));
  };

  // Initialize Battle
  useEffect(() => {
    setBattleState(initializeBattle(player, opponent));
  }, [player, opponent]);

  // MULTIPLAYER LISTENER
  useEffect(() => {
    if (gameMode === "pvp" && roomId) {
      const channel = pusherClient.subscribe(roomId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleMove = (data: any) => {
        if (data.attacker === player.username) return;
        if (data.moveId && data.moveId === lastMoveId.current) return;
        
        if (data.moveId) lastMoveId.current = data.moveId;

        setBattleState((prev) => {
          if (!prev) return null;

          let newHealCd = prev.playerHealCd;
          let newSpecialCd = prev.playerSpecialCd;

          if (newHealCd > 0) newHealCd -= 1;
          if (newSpecialCd > 0) newSpecialCd -= 1;

          const newPlayerHp = Math.max(0, prev.playerHp - (data.damage || 0));
          const newOpponentHp = Math.min(prev.opponentMaxHp, prev.opponentHp + (data.heal || 0));

          if ((data.damage || 0) > 0) {
              spawnNumber(`-${data.damage}`, "player", "damage");
              playSound("damage");
              setP1Anim("damaged");
              setTimeout(() => setP1Anim(""), 600);
          }

          if ((data.heal || 0) > 0) {
              spawnNumber(`+${data.heal}`, "opponent", "heal");
              playSound("heal");
          }
          
          const winner = newPlayerHp <= 0 ? "opponent" : null;

          return {
                ...prev,
                playerHp: newPlayerHp,
                opponentHp: newOpponentHp,
                playerHealCd: newHealCd,
                playerSpecialCd: newSpecialCd,
                logs: [data.logMessage, ...prev.logs],
                isPlayerTurn: true, 
                winner: winner,
            };
          });
      };
      
      const handlePlayerLeft = (data: { username: string }) => {
        if (data.username !== player.username) {
          setBattleState((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              winner: "player",  
              logs: [`${data.username} fled the battle!`, ...prev.logs]
            };
          });
        }
      };
          
      channel.bind("battle-move", handleMove);
      channel.bind("player-left", handlePlayerLeft);

      return () => {
        channel.unbind("battle-move", handleMove);
        channel.unbind("player-left", handlePlayerLeft);
        pusherClient.unsubscribe(roomId);
      };
    }
  }, [gameMode, roomId, player.username]);


  // Handle Enemy Turn (Auto - PVE ONLY)
  useEffect(() => {
    if (gameMode === "pvp") return;

    if (battleState && !battleState.winner && !battleState.isPlayerTurn) {
      const timer = setTimeout(() => {
        setBattleState((prev) => {
          if (!prev) return null;
          const newState = performOpponentTurn(prev, player, opponent);
          const dmgTaken = prev.playerHp - newState.playerHp;
          const healed = newState.opponentHp - prev.opponentHp;
          if (dmgTaken > 0) {
            spawnNumber(`-${dmgTaken}`,"player","damage");
            playSound("damage");
          }
          if (healed > 0) {
            spawnNumber(`+${healed}`,"opponent","heal");
            playSound("heal");
          }
          setP2Anim("attacking"); 
          setTimeout(() => setP1Anim("damaged"), 250); 
          setTimeout(() => { setP2Anim(""); setP1Anim(""); }, 600);
          return newState;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [battleState, player, opponent, gameMode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [battleState?.logs]);

  if (!battleState) return <div className="text-white text-center p-10 font-mono">LOADING BATTLE...</div>;

  const handleAction = async (action: "attack" | "heal" | "special") => {
    if (action === "attack") playSound("attack");
    if (action === "heal") playSound("heal");
    if (action === "special") playSound("attack");
    
    if (action === "attack" || action === "special") {
      setP1Anim("attacking"); 
      setTimeout(() => setP2Anim("damaged"), 250); 
      setTimeout(() => { setP1Anim(""); setP2Anim(""); }, 600);
    }
    
    if (!battleState) return;
    const newState = performPlayerTurn(battleState, player, opponent, action);
    
    const dmgDealt = battleState.opponentHp - newState.opponentHp;
    const healed = newState.playerHp - battleState.playerHp;
    
    if (dmgDealt > 0) spawnNumber(`-${dmgDealt}`,"opponent","damage");
    if (healed > 0) spawnNumber(`+${healed}`,"player","heal");

    setBattleState(newState);

    if (gameMode === "pvp" && roomId) {
        try {
            await sendBattleMove(roomId, {
                attacker: player.username,
                damage: dmgDealt,
                heal: healed,
                logMessage: newState.logs[0]
            });
        } catch (error) {
            console.error("Failed to send move:", error);
        }
    }
  };

  const healsLeft = 3 - battleState.playerHealsUsed;
  
  let healButtonText = "MERGE SHIELD";
  if (healsLeft <= 0) healButtonText = "EMPTY";
  else if (battleState.playerHealCd > 0) healButtonText = `WAIT (${battleState.playerHealCd})`;
  else healButtonText = `SHIELD (${healsLeft})`;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] font-mono flex flex-col items-center py-10 relative overflow-hidden">
      
      {/* RENDER DAMAGE LAYERS */}
      <div className="absolute inset-0 pointer-events-none z-50">
        {damageNumbers.map(num => (
          <DamageNumber
            key={num.id}
            {...num}
            onComplete={handleDamageComplete}
          />
        ))}
      </div>
      
      {/* EXIT BUTTON */}
      <button
        onClick={() => setShowExitConfirm(true)}
        className="absolute top-4 left-4 z-20 bg-white text-black border-4 border-black px-4 py-2 retro-font text-sm hover:bg-red-500 hover:text-white transition-colors shadow-[4px_4px_0px_rgba(0,0,0,0.5)]"
      >
        ← EXIT
      </button>

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
      <div className="mt-8 flex flex-wrap justify-center gap-4 w-full max-w-2xl">
        <button
          onClick={() => handleAction("attack")}
          disabled={!battleState.isPlayerTurn || !!battleState.winner}
          className="retro-font bg-[#ff6b6b] text-white text-lg md:text-xl px-8 py-4 border-4 border-black pixel-shadow hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000] hover:bg-red-700 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <PixelSword className="w-6 h-6" /> ATTACK
        </button>

        <button
          onClick={() => handleAction("special")}
          disabled={!battleState.isPlayerTurn || !!battleState.winner || battleState.playerSpecialCd > 0}
          className={`retro-font text-white text-lg md:text-xl px-8 py-4 border-4 border-black pixel-shadow transition-all flex items-center gap-2
            ${(!battleState.isPlayerTurn || battleState.playerSpecialCd > 0) 
              ? "bg-gray-500 cursor-not-allowed opacity-70"
              : "bg-[#845ec2] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000] hover:bg-purple-700 active:translate-y-1 active:shadow-none" 
            }`}
        >
          <PixelSword className="w-6 h-6" /> 
          {player.class === "Frontend Warrior" ? "PIXEL SLASH" :
           player.class === "Backend Mage" ? "DDOS BLAST" :
           player.class === "DevOps Paladin" ? "SHIELD BASH" :
           "SPECIAL"} 
           
          {battleState.playerSpecialCd > 0 && ` (${battleState.playerSpecialCd})`}
        </button>

        <button
          onClick={() => handleAction("heal")}
          disabled={!battleState.isPlayerTurn || !!battleState.winner || battleState.playerHealCd > 0 || battleState.playerHealsUsed >= 3}
          className={`retro-font text-white text-lg md:text-xl px-8 py-4 border-4 border-black pixel-shadow transition-all flex items-center gap-2
            ${(!battleState.isPlayerTurn || battleState.playerHealCd > 0 || battleState.playerHealsUsed >= 3)
              ? "bg-gray-500 cursor-not-allowed opacity-70" 
              : "bg-[#4ecdc4] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000] hover:bg-cyan-700 active:translate-y-1 active:shadow-none"
            }`}
        >
          <PixelShield className="w-6 h-6" />
          {battleState.playerHealsUsed >= 3 ? "EMPTY" : "HEAL"}
          {battleState.playerHealCd > 0 && battleState.playerHealsUsed < 3 && `(${battleState.playerHealCd})`}
        </button>
      </div>

      {/* WAITING FOR OPPONENT / LEAVE BUTTON */}
      {!battleState.isPlayerTurn && !battleState.winner && (
         <div className="flex flex-col items-center gap-2 mt-4">
             <p className="text-center text-white retro-font text-sm animate-pulse">
                {gameMode === "pvp" ? "WAITING FOR OPPONENT..." : "OPPONENT IS THINKING..."}
             </p>
             
             {gameMode === "pvp" && (
                 <button 
                    onClick={() => setShowExitConfirm(true)}
                    className="text-[10px] text-gray-400 hover:text-white underline retro-font"
                 >
                    Taking too long? Leave Battle
                 </button>
             )}
         </div>
      )}

      {/* EXIT CONFIRMATION MODAL */}
      {showExitConfirm && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white border-4 border-black p-8 text-center pixel-shadow max-w-sm mx-4">
            <h3 className="retro-font text-sm mb-6 text-black">RETREAT FROM BATTLE?</h3>
            <p className="retro-font text-sm mb-6 text-gray-700">Are you sure you want to quit? Current progress will be lost.</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="retro-font px-6 py-3 cursor-pointer bg-gray-200 border-4 border-black hover-bg-gray-300 text-black text-sm transition-colors"
              >
                NO, FIGHT!
              </button>
              <button
                onClick={async () => {
                  if (gameMode === "pvp" && roomId) {
                    await notifyOpponentLeft(roomId, player.username);
                  }
                  onReset();
                }}
                className="retro-font px-6 py-3 bg-[#ff6b6b] border-4 border-black hover-bg-red-600 text-white text-sm transition-colors cursor-pointer"
              >
                YES, QUIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL */}
      {battleState.winner && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in duration-500">
          <div className={`border-8 p-8 text-center pixel-shadow 
            ${battleState.winner === "player" ? "bg-[#ffd700] border-white text-black" : "bg-[#ff6b6b] border-white text-white"}`}
          >
            <h2 className="text-4xl md:text-6xl mb-4 retro-font">
              {battleState.winner === "player" ? "VICTORY! 🏆" : "GAME OVER 💀"}
            </h2>
            
            <p className="text-xl mb-8 retro-font">
              {battleState.winner === "player" ? "You defeated the enemy!" : "You were defeated..."}
            </p>
            
            <div className="flex flex-col gap-4">
                <button 
                  onClick={onReset}
                  className="bg-white text-black border-4 border-black px-8 py-4 text-xl hover:bg-gray-200 pixel-shadow retro-font cursor-pointer"
                >
                  PLAY AGAIN
                </button>

                {/* 🔥 NEW MAIN MENU BUTTON 🔥 */}
                {onMainMenu && (
                    <button 
                      onClick={onMainMenu}
                      className="bg-black text-white border-4 border-white px-8 py-2 text-sm hover:bg-gray-800 pixel-shadow retro-font cursor-pointer"
                    >
                      EXIT TO MENU
                    </button>
                )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}