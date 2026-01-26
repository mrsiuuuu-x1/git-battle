import { Character } from "../lib/github";

interface UserCardProps {
  character: Character;
}

export default function UserCard({ character }: UserCardProps) {
  // Determine bonus text based on class
  let bonusText = "";
  if (character.class === "Frontend Warrior") {
    bonusText = "⚡ +25% SPEED";
  } else if (character.class === "Backend Mage") {
    bonusText = "⚔️ +25% ATTACK";
  } else if (character.class === "DevOps Paladin") {
    bonusText = "🛡️ +25% DEFENSE";
  } else {
    bonusText = "⚖️ BALANCED STATS";
  }

  return (
    <div className="retro-font w-80 bg-white/10 border-4 border-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,0.3)] relative hover:-translate-y-1 hover:shadow-[10px_10px_0px_rgba(0,0,0,0.3)] transition-all duration-200">      
      
      {/* Header: Avatar & Class */}
      <div className="flex flex-col items-center border-b-4 border-black pb-4 mb-4">
        <img 
          src={character.avatar} 
          alt={character.username} 
          className="w-24 h-24 rounded-full border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.2)] mb-4 bg-white"
        />
        <h2 className="text-lg text-white mb-2 text-center break-all">{character.username}</h2>
        
        {/* Class Badge */}
        <span className="text-[10px] text-black bg-[#ffd700] px-3 py-1 border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
          Lvl 1 {character.class.split(' ')[0]}
        </span>

        {/* Bonus Badge */}
        <span className="text-[8px] text-[#ff6b6b] mt-2 font-bold animate-pulse">
          {bonusText}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="p-6 space-y-4">
        
        {/* HP Stat */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-white">
            <span>HP</span>
            <span>{character.stats.hp}</span>
          </div>
          <div className="h-4 bg-black/50 border-2 border-black">
            <div 
              className="h-full bg-[#4ecdc4]" 
              style={{ width: `${Math.min(character.stats.hp / 10, 100)}%` }} 
            />
          </div>
        </div>

        {/* Attack Stat */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-white">
            <span>ATK</span>
            <span>{character.stats.attack}</span>
          </div>
          <div className="h-4 bg-black/50 border-2 border-black">
            <div 
              className="h-full bg-[#ff6b6b]" 
              style={{ width: `${Math.min(character.stats.attack, 100)}%` }} 
            />
          </div>
        </div>

        {/* Defense Stat */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-white">
            <span>DEFENSE</span>
            <span>{character.stats.defense}</span>
          </div>
          <div className="h-4 bg-black/50 border-2 border-black">
            <div 
              className="h-full bg-[#54a0ff]" 
              style={{ width: `${Math.min(character.stats.defense / 5, 100)}%` }} 
            />
          </div>
        </div>

        {/* Speed Stat */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-white">
            <span>SPEED</span>
            <span>{character.stats.speed}</span>
          </div>
          <div className="h-4 bg-black/50 border-2 border-black">
            <div 
              className="h-full bg-green-500" 
              style={{ width: `${Math.min(character.stats.speed, 100)}%` }} 
            />
          </div>
        </div>

      </div>
    </div>
  );
}