"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Character } from "../lib/github";
import { pusherClient } from "../lib/pusher";
import { notifyPlayerReady, joinMultiplayerRoom, notifyHostReply, notifyOpponentLeft } from "../actions"; 
import UserCard from "./UserCard"; 
import BattleView from "./BattleView";
import { playSound } from "../lib/sounds";

interface ActiveRoomProps {
  player: Character;
  roomId: string;
  initialOpponent?: Character | null;
}

export default function ActiveRoom({ player, roomId, initialOpponent }: ActiveRoomProps) {
  const router = useRouter();
  const [opponent, setOpponent] = useState<Character | null>(initialOpponent || null);
  const [amIReady, setAmIReady] = useState(false);
  const [isOpponentReady, setIsOpponentReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  // 🔥 Exit Logic States
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [closingIn, setClosingIn] = useState<number | null>(null);

  const isHostRef = useRef(!initialOpponent);

  // 🔥 NEW: Track game status in a Ref so the Event Listener can read it safely
  const gameStartedRef = useRef(gameStarted);
  
  // Keep the Ref in sync with the state
  useEffect(() => {
    gameStartedRef.current = gameStarted;
  }, [gameStarted]);

  // 1. Handshake & Room Events
  useEffect(() => {
    if (!roomId) return;

    joinMultiplayerRoom(roomId, player);

    const channel = pusherClient.subscribe(roomId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channel.bind("user-joined", async (incomingPlayer: any) => {
      if (incomingPlayer.username === player.username) return;
      setOpponent(incomingPlayer);
      setOpponentLeft(false); 
      setClosingIn(null); // Cancel timer if they rejoin
      //playSound("beep"); 

      if (isHostRef.current) {
          await notifyHostReply(roomId, player);
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channel.bind("host-reply", (hostProfile: any) => {
        if (hostProfile.username === player.username) return;
        setOpponent(hostProfile);
        setOpponentLeft(false);
        setClosingIn(null);
        isHostRef.current = false; 
    });

    channel.bind("player-ready", (data: { username: string }) => {
      if (data.username !== player.username) {
        setIsOpponentReady(true);
        //playSound("beep");
      }
    });

    // 🔥 OPPONENT LEFT (Fixed Logic)
    channel.bind("player-left", (data: { username: string }) => {
        if (data.username !== player.username) {
            setOpponentLeft(true);
            setOpponent(null);
            setIsOpponentReady(false);
            
            // Check the REF to see if we should start the timer immediately
            // This avoids the ESLint error and state sync issues
            if (!gameStartedRef.current) {
                setClosingIn(3); 
            }
        }
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(roomId);
    };
  }, [roomId, player]); 

  // 2. Start Game Check
  useEffect(() => {
    if (amIReady && isOpponentReady && opponent && !opponentLeft) {
      setTimeout(() => {
        setGameStarted(true);
        //playSound("start");
      }, 500);
    }
  }, [amIReady, isOpponentReady, opponent, opponentLeft]);

  // 3. Timer Countdown Logic
  useEffect(() => {
      if (closingIn !== null) {
          if (closingIn <= 0) {
              router.push("/"); // Time up
          } else {
              const timer = setTimeout(() => {
                  setClosingIn((prev) => (prev !== null ? prev - 1 : null));
              }, 1000);
              return () => clearTimeout(timer);
          }
      }
  }, [closingIn, router]);


  const handleReadyClick = async () => {
    setAmIReady(true);
    await notifyPlayerReady(roomId, player.username);
  };

  const handlePlayAgain = () => {
      setGameStarted(false);     
      setAmIReady(false);        
      setIsOpponentReady(false); 
      // Note: If opponent already left, the 'player-left' event listener handles the logic
      // because we reset 'gameStarted' to false, but the opponentLeft state remains true.
      if (opponentLeft) {
          setClosingIn(3);
      }
  };

  const handleMainMenu = async () => {
      if (opponent) {
        await notifyOpponentLeft(roomId, player.username);
      }
      router.push("/");
  };

  if (gameStarted && opponent) {
    return (
      <BattleView 
        player={player} 
        opponent={opponent} 
        roomId={roomId}
        gameMode="pvp"
        onReset={handlePlayAgain}   
        onMainMenu={handleMainMenu} 
        opponentHasLeft={opponentLeft} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative">
      
      <button 
        onClick={handleMainMenu}
        className="absolute top-4 left-4 retro-font text-xs text-gray-400 hover:text-white underline z-20"
      >
        ← EXIT TO MENU
      </button>

      {/* 🔥 POPUP WARNING 🔥 */}
      {closingIn !== null && (
          <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center animate-in fade-in">
              <div className="bg-white border-4 border-black p-8 text-center">
                  <h2 className="retro-font text-red-500 text-xl mb-4">OPPONENT LEFT!</h2>
                  <p className="retro-font text-sm mb-4">Returning to menu in...</p>
                  <p className="retro-font text-4xl">{closingIn}</p>
              </div>
          </div>
      )}

      <div className="mb-10 text-center">
         <h1 className="retro-font text-3xl md:text-4xl text-white mb-2 animate-pulse">
            {opponent ? "VS MODE" : "WAITING FOR CHALLENGER..."}
         </h1>
         <div className="retro-font text-[#4ecdc4] text-sm border-2 border-[#4ecdc4] px-4 py-2 inline-block">
            ROOM ID: {roomId}
         </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-10 md:gap-20">
        
        {/* MY CARD */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
             {player && <UserCard character={player} />}
             {amIReady && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center border-4 border-[#4ecdc4]">
                    <span className="retro-font text-[#4ecdc4] text-xl bg-black px-4 py-2 rotate-12 border-2 border-[#4ecdc4]">
                        READY!
                    </span>
                </div>
             )}
          </div>
          <p className="retro-font text-white text-sm">YOU</p>
        </div>

        {/* VS LOGO */}
        <div className="retro-font text-5xl text-[#ffd700] drop-shadow-[4px_4px_0_#000]">
            VS
        </div>

        {/* OPPONENT CARD */}
        <div className="flex flex-col items-center gap-4">
          {opponent ? (
            <div className="relative">
                 <UserCard character={opponent} />
                 {isOpponentReady && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center border-4 border-[#ff6b6b]">
                        <span className="retro-font text-[#ff6b6b] text-xl bg-black px-4 py-2 -rotate-12 border-2 border-[#ff6b6b]">
                            READY!
                        </span>
                    </div>
                 )}
            </div>
          ) : (
            <div className="w-80 h-[400px] border-4 border-dashed border-gray-600 flex items-center justify-center bg-gray-800/50">
                <div className="text-center p-4">
                    <div className="w-12 h-12 border-4 border-[#4ecdc4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="retro-font text-gray-500 text-xs animate-pulse">
                        {opponentLeft ? "OPPONENT LEFT" : "SCANNING NETWORK..."}
                    </p>
                </div>
            </div>
          )}
          <p className="retro-font text-white text-sm">
            {opponent ? opponent.username : "???"}
          </p>
        </div>

      </div>

      <div className="mt-16">
        {!opponent ? (
            <p className="retro-font text-gray-500 text-xs">Waiting for opponent to join...</p>
        ) : (
            <button
                onClick={handleReadyClick}
                disabled={amIReady}
                className={`retro-font text-xl px-12 py-6 border-4 border-black shadow-[8px_8px_0px_#000] transition-all
                    ${amIReady 
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed translate-y-2 shadow-none" 
                        : "bg-[#ffd700] text-black hover:-translate-y-2 hover:shadow-[12px_12px_0px_#000] hover:bg-yellow-300"
                    }`}
            >
                {amIReady ? "WAITING FOR OPPONENT..." : "⚔️ FIGHT!"}
            </button>
        )}
      </div>

    </div>
  );
}