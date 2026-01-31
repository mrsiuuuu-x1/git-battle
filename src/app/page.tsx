"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import BattleView from "./components/BattleView";
import { getCharacterProfile, Character } from "./lib/github";
import { PixelSword, PixelShield } from "./components/PixelIcons";

export default function Home() {
  const { data: session, status } = useSession();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerData, setPlayerData] = useState<Character | null>(null);
  const [opponentData, setOpponentData] = useState<Character | null>(null);
  const [loadingGame, setLoadingGame] = useState(false);
  
  // Difficulty State
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  // START GAME (PVE MODE)
  const handleStartGame = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const username = (session?.user as any)?.username || session?.user?.name;
    
    if (!username) {
      alert("Error: Could not find your username. Try logging out and back in.");
      return;
    }

    setLoadingGame(true);

    try {
      // Fetch Player Data (You)
      const player = await getCharacterProfile(username);
      
      // Pick Bot based on difficulty
      let botName = "octocat"; 
      if (difficulty === "easy") botName = "defunkt"; 
      if (difficulty === "hard") botName = "torvalds"; 

      const opponent = await getCharacterProfile(botName); 

      if (!player || !opponent) {
        throw new Error("Failed to fetch character data");
      }

      // balance the bot
      let hpMultiplier = 1.0;
      if (difficulty === "easy") hpMultiplier = 0.8;
      if (difficulty === "medium") hpMultiplier = 1.0;
      if (difficulty === "hard") hpMultiplier = 1.5;

      // Scale Hp
      opponent.stats.hp = Math.floor(player.stats.hp * hpMultiplier);
      opponent.stats.attack = Math.floor(player.stats.attack * hpMultiplier);
      
      setPlayerData(player);
      setOpponentData(opponent);
      setIsPlaying(true);
    } catch (error) {
      console.error("Failed to load battle data", error);
      alert("Could not load GitHub data. API limit reached?");
    } finally {
      setLoadingGame(false);
    }
  };

  if (status === "loading" || loadingGame) {
    return (
      <div className="min-h-screen bg-[#2d3748] flex items-center justify-center">
        <div className="retro-font text-white text-2xl animate-pulse">LOADING...</div>
      </div>
    );
  }

  if (isPlaying && playerData && opponentData) {
    return (
      <BattleView 
        player={playerData} 
        opponent={opponentData} 
        onReset={() => setIsPlaying(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a202c] to-[#2d3748] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      <div className="z-10 text-center max-w-2xl w-full border-4 border-black bg-white/10 backdrop-blur-sm p-8 shadow-[8px_8px_0_#000]">
        
        <h1 className="retro-font text-4xl md:text-6xl text-[#ffd700] mb-8 drop-shadow-[4px_4px_0_#000]">
          GIT BATTLE
        </h1>

        {status === "authenticated" ? (
          <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 border-b-4 border-black pb-4 w-full justify-center">
              <img 
                src={session.user?.image || ""} 
                alt="Avatar" 
                className="w-16 h-16 border-4 border-black bg-white"
              />
              <div className="text-left">
                <p className="retro-font text-white text-xs mb-1">WELCOME BACK,</p>
                <p className="retro-font text-[#4ecdc4] text-xl">{session.user?.name}</p>
              </div>
            </div>

            {/* DIFFICULTY SELECTOR */}
            <div className="flex gap-2 w-full justify-center">
              {["easy", "medium", "hard"].map((level) => (
                <button
                  key={level}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={() => setDifficulty(level as any)}
                  className={`retro-font px-4 py-2 border-4 border-black text-xs uppercase transition-all
                    ${difficulty === level 
                      ? "bg-[#ffd700] text-black translate-y-1 shadow-none" 
                      : "bg-gray-200 text-gray-500 hover:bg-white shadow-[4px_4px_0_#000]"}`}
                >
                  {level}
                </button>
              ))}
            </div>

            <button 
              onClick={handleStartGame}
              className="w-full bg-[#ff6b6b] border-4 border-black text-white retro-font py-4 text-xl hover:bg-red-600 hover:-translate-y-1 hover:shadow-[4px_4px_0_#000] transition-all flex justify-center items-center gap-2"
            >
              <PixelSword className="w-6 h-6" /> FIGHT BOT
            </button>

            <button 
              onClick={() => signOut()}
              className="text-gray-400 retro-font text-xs hover:text-white mt-4 underline"
            >
              LOGOUT
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <p className="retro-font text-white text-sm md:text-base leading-loose mb-4">
              CONNECT YOUR GITHUB TO ENTER THE ARENA. <br/>
              YOUR COMMITS DETERMINE YOUR STRENGTH.
            </p>
            <button 
              onClick={() => signIn("github")}
              className="bg-[#24292e] border-4 border-black text-white retro-font px-8 py-4 text-lg md:text-xl hover:bg-black hover:-translate-y-1 hover:shadow-[4px_4px_0_#fff] transition-all flex items-center gap-3"
            >
             LOGIN WITH GITHUB
            </button>
          </div>
        )}
      </div>
    </div>
  );
}