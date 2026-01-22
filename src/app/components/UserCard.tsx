import { Character } from "../lib/github";

interface UserCardProps {
  character: Character;
}

export default function UserCard({ character }: UserCardProps) {
  return (
    <div className="relative w-80 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl hover:scale-105 transition-transform duration-300">
      
      {/* Header: Avatar & Class */}
      <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 p-6 flex flex-col items-center border-b border-zinc-700">
        <img 
          src={character.avatar} 
          alt={character.username} 
          className="w-24 h-24 rounded-full border-4 border-indigo-500 shadow-lg mb-4"
        />
        <h2 className="text-2xl font-bold text-white">{character.username}</h2>
        <span className="text-sm font-mono text-indigo-400 bg-indigo-900/30 px-3 py-1 rounded-full mt-2">
          Lvl {character.level} {character.class}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="p-6 space-y-4">
        
        {/* HP Stat */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-gray-400">
            <span>HP</span>
            <span>{character.stats.hp}</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500" 
              style={{ width: `${Math.min(character.stats.hp / 10, 100)}%` }} // Cap visual at 100%
            />
          </div>
        </div>

        {/* Attack Stat */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-gray-400">
            <span>ATTACK</span>
            <span>{character.stats.attack}</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-yellow-500" 
              style={{ width: `${Math.min(character.stats.attack, 100)}%` }} 
            />
          </div>
        </div>

        {/* Defense Stat */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-gray-400">
            <span>DEFENSE</span>
            <span>{character.stats.defense}</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500" 
              style={{ width: `${Math.min(character.stats.defense / 5, 100)}%` }} 
            />
          </div>
        </div>

        {/* Speed Stat */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-gray-400">
            <span>SPEED</span>
            <span>{character.stats.speed}</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
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