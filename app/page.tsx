"use client";
import { useState } from 'react';
import { getPlayerStats } from '../lib/github';
import "nes.css/css/nes.min.css"; 

export default function Home() {
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [stats1, setStats1] = useState<any>(null);
  const [stats2, setStats2] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const handleBattle = async () => {
    if (!p1 || !p2) return;
    setLoading(true);
    setWinner(null);

    // Fetch both players at the same time
    const [data1, data2] = await Promise.all([
      getPlayerStats(p1),
      getPlayerStats(p2)
    ]);

    setStats1(data1);
    setStats2(data2);

    // Decide the Winner (more followers = win)
    if (data1 && data2) {
      if (data1.followers.totalCount > data2.followers.totalCount) {
        setWinner(data1.login);
      } else if (data2.followers.totalCount > data1.followers.totalCount) {
        setWinner(data2.login);
      } else {
        setWinner("DRAW");
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 font-mono">
      
      {/* HEADER */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl text-yellow-400 mb-4 animate-bounce">⚔️ GIT BATTLE ⚔️</h1>
        {winner && (
          <div className="nes-container is-rounded is-dark">
            <p className="text-green-400 text-xl">🏆 WINNER: {winner} 🏆</p>
          </div>
        )}
      </div>

      {/* BATTLE ARENA */}
      <div className="flex flex-col md:flex-row gap-8 items-start w-full max-w-4xl justify-center">
        
        {/* PLAYER 1 COLUMN */}
        <div className="nes-container is-dark with-title flex-1 w-full">
          <p className="title text-blue-400">Player 1</p>
          <input 
            type="text" 
            className="nes-input is-dark mb-4" 
            placeholder="Username..."
            value={p1}
            onChange={(e) => setP1(e.target.value)}
          />
          {stats1 && (
            <div className="text-center">
              <img 
                src={stats1.avatarUrl} 
                alt="P1" 
                className={`border-4 mx-auto mb-4 ${winner === stats1.login ? 'border-yellow-400' : 'border-gray-500'}`}
                style={{ width: '120px', height: '120px', imageRendering: 'pixelated' }}
              />
              <h3 className="text-xl mb-2">{stats1.login}</h3>
              <p className="text-red-500">HP: {stats1.followers.totalCount}</p>
              <progress className="nes-progress is-error" value={stats1.followers.totalCount} max="1000"></progress>
            </div>
          )}
        </div>

        {/* VS BUTTON */}
        <div className="self-center">
          <button 
            className={`nes-btn ${loading ? 'is-disabled' : 'is-error'}`} 
            onClick={handleBattle}
          >
            {loading ? 'FIGHTING...' : 'FIGHT!'}
          </button>
        </div>

        {/* PLAYER 2 COLUMN */}
        <div className="nes-container is-dark with-title flex-1 w-full">
          <p className="title text-red-400">Player 2</p>
          <input 
            type="text" 
            className="nes-input is-dark mb-4" 
            placeholder="Username..."
            value={p2}
            onChange={(e) => setP2(e.target.value)}
          />
          {stats2 && (
            <div className="text-center">
              <img 
                src={stats2.avatarUrl} 
                alt="P2" 
                className={`border-4 mx-auto mb-4 ${winner === stats2.login ? 'border-yellow-400' : 'border-gray-500'}`}
                style={{ width: '120px', height: '120px', imageRendering: 'pixelated' }}
              />
              <h3 className="text-xl mb-2">{stats2.login}</h3>
              <p className="text-red-500">HP: {stats2.followers.totalCount}</p>
              <progress className="nes-progress is-error" value={stats2.followers.totalCount} max="1000"></progress>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}