"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation"; 
import { getLeaderboard, getBattleHistory, getUserAchievements, createRoom, getPublicRooms } from "./actions";
import { ACHIEVEMENTS } from "./lib/achievements";
import { getTier, getTierProgress } from "./lib/tiers";
import BattleView from "./components/BattleView";
import { getCharacterProfile, Character } from "./lib/github";
import { PixelSword, PixelShield } from "./components/PixelIcons";

function HomeContent() {
  const { data: session, status } = useSession();
  const router = useRouter(); 
  const searchParams = useSearchParams();

  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingGame, setLoadingGame] = useState(false);
  const [menuStep, setMenuStep] = useState<"menu" | "difficulty" | "leaderboard" | "multiplayer" | "history" | "achievements">("menu");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [playerData, setPlayerData] = useState<Character | null>(null);
  const [opponentData, setOpponentData] = useState<Character | null>(null);
  const [roomId, setRoomId] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [publicRooms, setPublicRooms] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [battleHistory, setBattleHistory] = useState<{ battles: any[]; wins: number; losses: number; streak: number }>({ battles: [], wins: 0, losses: 0, streak: 0 });
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  // Check URL for ?mode=multiplayer
  useEffect(() => {
    if (searchParams.get("mode") === "multiplayer") {
        setMenuStep("multiplayer");
    }
  }, [searchParams]);

  const handleShowLeaderboard = async () => {
    const data = await getLeaderboard();
    setLeaderboard(data);
    setMenuStep("leaderboard");
  };

  const handleShowHistory = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const username = (session?.user as any)?.username || session?.user?.name;
    if (!username) return;
    const data = await getBattleHistory(username);
    setBattleHistory(data);
    setMenuStep("history");
  };

  const handleShowAchievements = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const username = (session?.user as any)?.username || session?.user?.name;
    if (!username) return;
    const data = await getUserAchievements(username);
    setEarnedAchievements(data.map(a => a.key));
    setMenuStep("achievements");
  };

  const refreshLobby = async () => {
    const { rooms } = await getPublicRooms();
    setPublicRooms(rooms || []);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (menuStep === "multiplayer") {
      refreshLobby();
      interval = setInterval(() => { refreshLobby(); }, 5000); 
    }
    return () => { if (interval) clearInterval(interval); };
  }, [menuStep]);

  const handleStartGame = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const username = (session?.user as any)?.username || session?.user?.name;
    if (!username) return alert("Error: Could not find your username.");

    setLoadingGame(true);

    try {
      const player = await getCharacterProfile(username);
      let botName = "octocat"; 
      if (difficulty === "easy") botName = "defunkt"; 
      if (difficulty === "hard") botName = "torvalds"; 
      const opponent = await getCharacterProfile(botName); 

      if (!player || !opponent) throw new Error("Failed to fetch data");

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
      alert("Could not load GitHub data.");
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
        onReset={() => {
            setIsPlaying(false);
            setMenuStep("menu");
            setRoomId("");
            setIsWaiting(false);
        }} 
        gameMode="pve" 
        roomId=""
      />
    );
  }

  const handleJoinSpecificRoom = async (targetRoomId: string, isHost: boolean) => {
    if (!targetRoomId) return alert("Please enter a Room ID!");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const username = (session?.user as any)?.username || session?.user?.name;
    if (!username) return alert("You must be logged in!");

    setIsWaiting(true);
    router.push(`/lobby/${targetRoomId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a202c] to-[#2d3748] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      <div className="z-10 text-center max-w-4xl w-full border-4 border-black bg-white/10 backdrop-blur-sm p-8 shadow-[8px_8px_0_#000]">
        
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

            {menuStep === "menu" && (
                <div className="w-full max-w-md flex flex-col gap-4 animate-in slide-in-from-right duration-300">
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
                       LEADERBOARD
                    </button>

                    <button
                      onClick={handleShowHistory}
                      className="w-full bg-[#4ecdc4] border-4 border-black cursor-pointer text-black retro-font py-4 text-xl hover:bg-teal-400 hover:-translate-y-1 hover:shadow-[4px_4px_0_#000] transition-all flex justify-center items-center gap-2"
                    >
                       BATTLE HISTORY
                    </button>

                    <button
                      onClick={handleShowAchievements}
                      className="w-full bg-[#ff9f43] border-4 border-black cursor-pointer text-black retro-font py-4 text-xl hover:bg-orange-400 hover:-translate-y-1 hover:shadow-[4px_4px_0_#000] transition-all flex justify-center items-center gap-2"
                    >
                       ACHIEVEMENTS
                    </button>

                    <button
                        onClick={() => setMenuStep("multiplayer")}
                        className="w-full bg-[#845ec2] cursor-pointer border-4 border-black text-white retro-font py-4 text-xl hover:bg-purple-600 hover:-translate-y-1 hover:shadow-[4px_4px_0_#000] transition-all flex justify-center items-center gap-2"
                        >
                        <PixelShield className="w-6 h-6" /> MULTIPLAYER LOBBY
                    </button>
                </div>
            )}

            {menuStep === "difficulty" && (
                <div className="w-full max-w-md flex flex-col gap-6 animate-in slide-in-from-right duration-300">
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
                    <button 
                        onClick={() => setMenuStep("menu")}
                        className="text-gray-400 retro-font text-xs hover:text-white underline cursor-pointer"
                    >
                        ← BACK TO MENU
                    </button>
                </div>
            )}

            {menuStep === "leaderboard" && (
              <div className="w-full max-w-md flex flex-col gap-4 animate-in slide-in-from-right duration-300">
                <h2 className="retro-font text-xl text-center text-[#ffd700] mb-2">HALL OF FAME</h2>
                <div className="bg-black/40 border-4 border-black p-4 max-h-60 overflow-y-auto">
                {leaderboard.length === 0 ? (
                  <p className="text-white retro-font text-center">NO LEGENDS YET...</p>
                ) : (
                  leaderboard.map((player, index) => {
                    const tier = getTier(player.wins);
                    return (
                      <div key={player.username} className="flex items-center justify-between border-b-2 border-gray-700 py-2 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-[#fcee09] retro-font">#{index + 1}</span>
                          <img src={player.avatar} alt="avatar" className="w-8 h-8 border-2 border-white rounded-full bg-white" />
                          <a href={`https://github.com/${player.username}`} target="_blank" rel="noopener noreferrer" className="text-white retro-font text-sm hover:text-[#4ecdc4] underline">{player.username}</a>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <span className="retro-font text-[10px] px-1.5 py-0.5 border border-black flex items-center gap-1" style={{ color: tier.color, backgroundColor: tier.bgColor }}>
                            <img src={tier.image} alt={tier.name} className="w-4 h-4 inline-block" style={{ filter: `drop-shadow(0 0 2px ${tier.color})` }} />
                            {tier.name}
                          </span>
                          <div>
                            <span className="text-[#4ecdc4] retro-font text-xs block">{player.wins} WINS</span>
                            <span className="text-gray-500 retro-font text-[10px] block">{player.losses} LOSSES</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
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

            {menuStep === "history" && (
              <div className="w-full max-w-md flex flex-col gap-4 animate-in slide-in-from-right duration-300">
                <h2 className="retro-font text-xl text-center text-[#4ecdc4] mb-2">BATTLE HISTORY</h2>

                {/* Stats Summary with Tier */}
                {(() => {
                  const { current, next, progress, winsToNext } = getTierProgress(battleHistory.wins);
                  return (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex justify-center gap-6 retro-font text-sm">
                        <span className="text-[#4ecdc4]">{battleHistory.wins} WINS</span>
                        <span className="text-[#ff6b6b]">{battleHistory.losses} LOSSES</span>
                        {battleHistory.streak > 0 && (
                          <span className="text-[#ffd700]">{battleHistory.streak} STREAK</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 retro-font text-xs">
                        <span className="flex items-center gap-1" style={{ color: current.color }}>
                          <img src={current.image} alt={current.name} className="w-5 h-5 inline-block" />
                          {current.name}
                        </span>
                        {next && (
                          <span className="text-gray-500 flex items-center gap-1">→ {winsToNext} wins to
                            <img src={next.image} alt={next.name} className="w-4 h-4 inline-block opacity-60" />
                            {next.name}
                          </span>
                        )}
                      </div>
                      {next && (
                        <div className="w-full max-w-xs h-2 bg-black/40 border border-gray-600 overflow-hidden">
                          <div className="h-full transition-all" style={{ width: `${progress}%`, backgroundColor: current.color }} />
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="bg-black/40 border-4 border-black p-4 max-h-72 overflow-y-auto">
                  {battleHistory.battles.length === 0 ? (
                    <p className="text-white retro-font text-center">NO BATTLES YET...</p>
                  ) : (
                    battleHistory.battles.map((battle, index) => (
                      <div key={index} className="flex items-center justify-between border-b-2 border-gray-700 py-2 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className={`retro-font text-xs px-2 py-1 border-2 border-black ${battle.winner === "player" ? "bg-[#4ecdc4] text-black" : "bg-[#ff6b6b] text-white"}`}>
                            {battle.winner === "player" ? "WIN" : "LOSS"}
                          </span>
                          <span className="text-white retro-font text-xs">vs</span>
                          <a href={`https://github.com/${battle.opponent}`} target="_blank" rel="noopener noreferrer" className="text-white retro-font text-sm hover:text-[#4ecdc4] underline">
                            {battle.opponent}
                          </a>
                        </div>
                        <span className="text-gray-500 retro-font text-[10px]">
                          {new Date(battle.createdAt).toLocaleDateString()}
                        </span>
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

            {menuStep === "achievements" && (
              <div className="w-full max-w-lg flex flex-col gap-4 animate-in slide-in-from-right duration-300">
                <h2 className="retro-font text-xl text-center text-[#ff9f43] mb-2">ACHIEVEMENTS</h2>
                <p className="retro-font text-xs text-center text-gray-400 mb-2">
                  {earnedAchievements.length}/{ACHIEVEMENTS.length} UNLOCKED
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {ACHIEVEMENTS.map((achievement) => {
                    const unlocked = earnedAchievements.includes(achievement.key);
                    return (
                      <div
                        key={achievement.key}
                        className={`border-4 border-black p-3 text-center transition-all ${
                          unlocked
                            ? "bg-[#ffd700]/20 shadow-[4px_4px_0px_rgba(0,0,0,0.3)]"
                            : "bg-black/40 opacity-50"
                        }`}
                      >
                        <div className="text-2xl mb-1">{unlocked ? achievement.icon : "🔒"}</div>
                        <div className={`retro-font text-xs mb-1 ${unlocked ? "text-[#ffd700]" : "text-gray-500"}`}>
                          {achievement.name}
                        </div>
                        <div className="retro-font text-[9px] text-gray-400">
                          {achievement.description}
                        </div>
                        <div className={`retro-font text-[8px] mt-1 px-1 py-0.5 border border-black inline-block ${
                          achievement.category === "battle" ? "bg-[#ff6b6b]/30 text-[#ff6b6b]" :
                          achievement.category === "github" ? "bg-[#4ecdc4]/30 text-[#4ecdc4]" :
                          "bg-[#845ec2]/30 text-[#845ec2]"
                        }`}>
                          {achievement.category.toUpperCase()}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => setMenuStep("menu")}
                  className="text-gray-400 retro-font text-xs hover:text-white underline mt-2 text-center cursor-pointer"
                >
                  ← BACK TO MENU
                </button>
              </div>
            )}

            {menuStep === "multiplayer" && (
                <div className="flex flex-col md:flex-row gap-6 w-full animate-in zoom-in">
                    <div className="flex-1 bg-black/40 border-4 border-black p-6 flex flex-col gap-4">
                        <h3 className="retro-font text-[#fcee09] text-xl text-center">🔒 PRIVATE</h3>
                        <p className="retro-font text-xs text-gray-300 text-center">Share a code with a friend.</p>
                        
                        <input 
                        type="text" 
                        placeholder="ENTER ROOM ID"
                        className="retro-font p-3 text-black border-4 border-black w-full text-center uppercase"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                        />
                        
                        <div className="flex gap-2">
                            <button 
                            onClick={() => handleJoinSpecificRoom(roomId, false)}
                            disabled={isWaiting}
                            className="flex-1 bg-[#00e756] border-4 border-black p-3 retro-font cursor-pointer hover:bg-green-400 text-black"
                            >
                            {isWaiting ? "WAIT..." : "JOIN"}
                            </button>
                            <button 
                            onClick={async () => {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const res = await createRoom((session.user as any)?.username || "Player", true);
                                if(res.success && res.roomId) {
                                    router.push(`/lobby/${res.roomId}`);
                                }
                            }}
                            className="flex-1 bg-[#845ec2] cursor-pointer border-4 border-black p-3 retro-font text-white hover:bg-purple-500"
                            >
                            CREATE
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 bg-black/40 border-4 border-black p-6 flex flex-col gap-4 h-[400px]">
                        <div className="flex justify-between items-center border-b-4 border-white pb-2">
                            <h3 className="retro-font text-[#ff4d4d] text-xl">🌍 PUBLIC</h3>
                            <button onClick={refreshLobby} className="text-xs retro-font cursor-pointer text-white hover:text-yellow-400">
                                🔄 REFRESH
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-2">
                            {publicRooms.length === 0 ? (
                                <div className="text-center text-gray-400 retro-font text-xs mt-10">
                                    NO BATTLES FOUND.<br/>START ONE!
                                </div>
                            ) : (
                                publicRooms.map((room) => (
                                    <div key={room.id} className="bg-white p-2 border-4 border-black flex justify-between items-center">
                                        <div>
                                            <p className="retro-font text-xs text-gray-500">HOST</p>
                                            <p className="retro-font text-sm font-bold text-black">{room.host}</p>
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                handleJoinSpecificRoom(room.id, false);
                                            }}
                                            className="bg-[#ff4d4d] text-white cursor-pointer px-4 py-1 border-2 border-black retro-font text-xs hover:bg-red-500"
                                        >
                                            FIGHT
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                        <button 
                            onClick={async () => {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const res = await createRoom((session.user as any)?.username || "Player", false);
                                if (res.success && res.roomId) {
                                    router.push(`/lobby/${res.roomId}`);
                                }
                            }}
                            className="w-full bg-[#fcee09] border-4 border-black p-3 retro-font text-black hover:bg-yellow-300 cursor-pointer"
                        >
                            + CREATE PUBLIC ROOM
                        </button>
                    </div>
                </div>
            )}

            {menuStep === "multiplayer" && (
                <button
                    onClick={() => setMenuStep("menu")}
                    className="text-gray-400 retro-font text-xs hover:text-white underline text-center cursor-pointer"
                >
                    ← BACK TO MENU
                </button>
            )}

            <button 
              onClick={() => signOut()}
              className="text-gray-400 retro-font text-xs hover:text-white mt-4 underline cursor-pointer"
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

      {errorMsg && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white border-4 border-black p-8 text-center pixel-shadow max-w-sm mx-4 relative">
            <div className="absolute top-0 left-0 right-0 h-4 bg-[#ff6b6b] border-b-4 border-black"></div>
            <h3 className="retro-font text-xl mb-4 text-[#ff6b6b] mt-4">ERROR</h3>
            <p className="retro-font text-sm mb-8 text-black leading-relaxed">
              {errorMsg === "ROOM NOT FOUND"
                ? "This Room ID does not exist. Check the code and try again."
                : errorMsg}
            </p>

            <button
              onClick={() => setErrorMsg("")}
              className="retro-font px-8 py-4 bg-gray-200 border-4 border-black hover:bg-gray-300 text-black text-sm transition-colors w-full cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-[#2d3748] flex items-center justify-center">
            <div className="retro-font text-white text-2xl animate-pulse">LOADING BATTLE...</div>
        </div>
    }>
      <HomeContent />
    </Suspense>
  );
}