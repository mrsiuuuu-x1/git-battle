"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { getLeaderboard } from "./actions";
import BattleView from "./components/BattleView";
import { joinMultiplayerRoom } from "./actions";
import { pusherClient } from "./lib/pusher";
import { getCharacterProfile, Character } from "./lib/github";
import { PixelSword, PixelShield } from "./components/PixelIcons";

export default function Home() {
  const { data: session, status } = useSession();
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingGame, setLoadingGame] = useState(false);
  const [menuStep, setMenuStep] = useState<"menu" | "difficulty" | "leaderboard" | "multiplayer">("menu");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [playerData, setPlayerData] = useState<Character | null>(null);
  const [opponentData, setOpponentData] = useState<Character | null>(null);
  const [roomId, setRoomId] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const [gameMode, setGameMode] = useState<"pve" | "pvp">("pve");
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const handleShowLeaderboard = async () => {
    const data = await getLeaderboard();
    setLeaderboard(data);
    setMenuStep("leaderboard");
  };

  // START GAME (PVE MODE)
  const handleStartGame = async () => {
    setGameMode("pve");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const username = (session?.user as any)?.username || session?.user?.name;
    
    if (!username) {
      alert("Error: Could not find your username. Try logging out and back in.");
      return;
    }

    setLoadingGame(true);

    try {
      // Fetch Player Data
      const player = await getCharacterProfile(username);
      
      // Pick Bot based on difficulty
      let botName = "octocat"; 
      if (difficulty === "easy") botName = "defunkt"; 
      if (difficulty === "hard") botName = "torvalds"; 

      const opponent = await getCharacterProfile(botName); 

      if (!player || !opponent) {
        throw new Error("Failed to fetch character data");
      }

      // Apply difficulty balance
      let hpMultiplier = 1.0;
      if (difficulty === "easy") hpMultiplier = 0.8;
      if (difficulty === "medium") hpMultiplier = 1.0;
      if (difficulty === "hard") hpMultiplier = 1.5;

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

  // BATTLE VIEW
  if (isPlaying && playerData && opponentData) {
    return (
      <BattleView 
        player={playerData} 
        opponent={opponentData} 
        onReset={() => {
            setIsPlaying(false);
            setMenuStep("menu");
            setRoomId("");
            pusherClient.unsubscribe(roomId);
        }} 
        gameMode={gameMode}
        roomId={roomId}
      />
    );
  }

  const handleJoinRoom = async () => {
    setGameMode("pvp");
    if (!roomId) return alert("Please enter a Room ID!");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const username = (session?.user as any)?.username || session?.user?.name;
    if (!username) return alert("You must be logged in!");

    setIsWaiting(true);

    //fetch own data
    const myProfile = await getCharacterProfile(username);
    setPlayerData(myProfile);
    
    const channel = pusherClient.subscribe(roomId);

    //wait, for someone to join game and then start
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channel.bind("user-joined", (incomingPlayer: any) => {
      if (incomingPlayer.username !== username) {
        setOpponentData(incomingPlayer);
        setIsPlaying(true);

        joinMultiplayerRoom(roomId, myProfile);
      }
    });
    await joinMultiplayerRoom(roomId, myProfile);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a202c] to-[#2d3748] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* GRID BACKGROUND */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      <div className="z-10 text-center max-w-2xl w-full border-4 border-black bg-white/10 backdrop-blur-sm p-8 shadow-[8px_8px_0_#000]">
        
        <h1 className="retro-font text-4xl md:text-6xl text-[#ffd700] mb-8 drop-shadow-[4px_4px_0_#000]">
          GIT BATTLE
        </h1>

        {status === "authenticated" ? (
          <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
            
            {/* USER PROFILE HEADER */}
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

            {/* SCREEN 1: MAIN MENU */}
            {menuStep === "menu" && (
                <div className="w-full flex flex-col gap-4 animate-in slide-in-from-right duration-300">
                     <button 
                        onClick={() => setMenuStep("difficulty")}
                        className="w-full bg-[#ff6b6b] border-4 border-black cursor-pointer text-white retro-font py-4 text-xl hover:bg-red-600 hover:-translate-y-1 hover:shadow-[4px_4px_0_#000] transition-all flex justify-center items-center gap-2"
                        >
                        <PixelSword className="w-6 h-6" /> FIGHT AI (PVE)
                    </button>

                    <button
                      onClick={handleShowLeaderboard}
                      className="w-full bg-[#fcee09] border-4 border-black cursor-pointer text-black retro-font py-4 text-xl hover:bg-yellow-400 hover:-translate-y-1 hover:shadow-[4px_4px_0_#000] transition-all flex justify-center items-center gap-2"
                    >
                      🏆 LEADERBOARD
                    </button>

                    <button 
                        onClick={() => setMenuStep("multiplayer")}
                        className="w-full bg-[#845ec2] cursor-pointer border-4 border-black text-white retro-font py-4 text-xl hover:bg-purple-600 hover:-translate-y-1 hover:shadow-[4px_4px_0_#000] transition-all flex justify-center items-center gap-2"
                        >
                        <PixelShield className="w-6 h-6" /> MULTIPLAYER LOBBY
                    </button>
                </div>
            )}

            {/* SCREEN 2: DIFFICULTY */}
            {menuStep === "difficulty" && (
                <div className="w-full flex flex-col gap-6 animate-in slide-in-from-right duration-300">
                    
                    {/* TOGGLES */}
                    <div className="flex gap-2 w-full justify-center">
                        {["easy", "medium", "hard"].map((level) => (
                            <button
                            key={level}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onClick={() => setDifficulty(level as any)}
                            className={`retro-font px-4 py-2 border-4 border-black text-xs uppercase transition-all cursor-pointer
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
                        className="w-full cursor-pointer bg-[#ff6b6b] border-4 border-black text-white retro-font py-4 text-xl hover:bg-red-600 hover:-translate-y-1 hover:shadow-[4px_4px_0_#000] transition-all flex justify-center items-center gap-2"
                    >
                        <PixelSword className="w-6 h-6" /> START BATTLE
                    </button>

                    {/* BACK BUTTON */}
                    <button 
                        onClick={() => setMenuStep("menu")}
                        className="text-gray-400 retro-font text-xs hover:text-white underline cursor-pointer"
                    >
                        ← BACK TO MENU
                    </button>
                </div>
            )}

            {/* SCREEN 3: LEADERBOARD */}
            {menuStep === "leaderboard" && (
              <div className="w-full flex flex-col gap-4 animate-in slide-in-from-right duration-300">
                <h2 className="retro-font text-xl text-center text-[#ffd700] mb-2">HALL OF FAME</h2>

                <div className="bg-black/40 border-4 border-black p-4 max-h-60 overflow-y-auto">
                {leaderboard.length === 0 ? (
                  <p className="text-white retro-font text-center">NO LEGENDS YET...</p>
                ) : (
                  leaderboard.map((player, index) => (
                    <div key={player.username} className="flex items-center justify-between border-b-2 border-gray-700 py-2 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-[#fcee09] retro-font">#{index + 1}</span>
                        <img src={player.avatar} alt="avatar" className="w-8 h-8 border-2 border-white rounded-full bg-white" />
                        <span className="text-white retro-font text-sm">{player.username}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#4ecdc4] retro-font text-xs block">{player.wins} WINS</span>
                        <span className="text-gray-500 retro-font text-[10px] block">{player.losses} LOSSES</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => setMenuStep("menu")}
                className="text-gray-400 retro-font text-xs hover:text-white underline mt-2 text-center cursor-pointer"
              >
                ← BACK TO MENU
              </button>
            </div>
            )}

            {/* SCREEN4: MULTIPLAYER LOBBY */}
            {menuStep === "multiplayer" && (
              <div className="w-full flex flex-col gap-6 animate-in slide-in-from-right duration-300">
                <h2 className="retro-font text-xl text-center text-[#845ec2] mb-2">ENTER THE ARENA</h2>

                <div className="bg-black/40 border-4 border-black p-6 flex flex-col gap-4">
                <p className="text-white retro-font text-sm text-center">
                  ENTER A ROOM ID TO JOIN A FRIEND
                </p>

                <input
                  type="text"
                  placeholder="ROOM-123"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full bg-white border-4 border-black p-3 retro-font text-center text-xl text-black uppercase placeholder:text-gray-400 focus:outline-none focus:shadow-[4px_4px_0_#845ec2]"
                />

                <button
                onClick={handleJoinRoom}
                disabled={isWaiting}
                  className="w-full bg-[#fcee09] border-4 border-black text-black retro-font py-3 text-lg hover:bg-yellow-400 hover:-translate-y-1 hover:shadow-[4px_4px_0_#fff] transition-all cursor-pointer"
                >
                  {isWaiting ? "WAITING FOR OPPONENT..." : "JOIN ROOM"}
                </button>
              </div>

              <button
                onClick={() => setMenuStep("menu")}
                className="text-gray-400 retro-font text-xs hover:text-white underline text-center cursor-pointer"
              >
                ← BACK TO MENU
              </button>
            </div>
            )}

            {/* LOGOUT BUTTON */}
            <button 
              onClick={() => signOut()}
              className="text-gray-400 retro-font text-xs hover:text-white mt-4 underline cursor-pointer"
            >
              LOGOUT
            </button>
          </div>
        ) : (
          // LOGGED OUT VIEW
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