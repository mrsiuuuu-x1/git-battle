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
  const [fighting, setFighting] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const handleBattle = async () => {
    if (!p1 || !p2) return;
    setLoading(true);
    setWinner(null);

    const [data1, data2] = await Promise.all([
      getPlayerStats(p1),
      getPlayerStats(p2)
    ]);
    
    setStats1(data1);
    setStats2(data2);
    setLoading(false);

    if (data1 && data2) {
      setFighting(true);
      
      setTimeout(() => {
        setFighting(false);
        if (data1.followers.totalCount > data2.followers.totalCount) {
          setWinner(data1.login);
        } else if (data2.followers.totalCount > data1.followers.totalCount) {
          setWinner(data2.login);
        } else {
          setWinner("DRAW");
        }
      }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono flex flex-col items-center p-4 overflow-hidden">
      
      <div className="mt-8 mb-8 text-center">
        <h1 className="text-4xl text-yellow-400 mt-4 mb-2 tracking-widest">GIT BATTLE</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center w-full max-w-5xl relative">
        
        {/* === PLAYER 1 === */}
        <div className={`transition-all duration-500 transform ${fighting ? 'translate-x-[200px] z-20 scale-125' : ''} nes-container is-dark with-title flex-1 w-full`}>
          <p className="title text-blue-400">Player 1</p>
          <input 
            type="text" 
            className="nes-input is-dark" 
            placeholder="e.g. torvalds"
            value={p1}
            onChange={(e) => setP1(e.target.value)}
          />
          {stats1 && (
            <div className="text-center mt-6">
              <img 
                src={stats1.avatarUrl} 
                alt="Player 1 Avatar"
                className="mx-auto border-4 border-white mb-4"
                style={{ width: '100px', height: '100px', imageRendering: 'pixelated' }}
              />
              <h2 className="text-xl text-blue-300">{stats1.login}</h2>
              <p className="text-xs text-red-400 mt-2">HP: {stats1.followers.totalCount}</p>
            </div>
          )}
        </div>

        {/* === VS BUTTON / EXPLOSION === */}
        <div className="z-10 flex flex-col items-center justify-center shrink-0 w-32">
          {fighting ? (
            <div className="text-6xl animate-ping">💥</div>
          ) : (
            <button 
              onClick={handleBattle}
              className={`nes-btn ${loading ? 'is-disabled' : 'is-error'} rounded-full h-20 w-20 flex items-center justify-center`}
            >
              VS
            </button>
          )}
        </div>

        {/* === PLAYER 2 === */}
        <div className={`transition-all duration-500 transform ${fighting ? '-translate-x-[200px] z-20 scale-125' : ''} nes-container is-dark with-title flex-1 w-full`}>
          <p className="title text-red-400">Player 2</p>
          <input 
            type="text" 
            className="nes-input is-dark" 
            placeholder="e.g. shadcn"
            value={p2}
            onChange={(e) => setP2(e.target.value)}
          />
          {stats2 && (
            <div className="text-center mt-6">
              {/* FIXED: Added alt tag below */}
              <img 
                src={stats2.avatarUrl} 
                alt="Player 2 Avatar"
                className="mx-auto border-4 border-white mb-4"
                style={{ width: '100px', height: '100px', imageRendering: 'pixelated' }}
              />
              <h2 className="text-xl text-red-300">{stats2.login}</h2>
              <p className="text-xs text-red-400 mt-2">HP: {stats2.followers.totalCount}</p>
            </div>
          )}
        </div>

      </div>

      {/* === WINNER BANNER === */}
      {winner && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
          <div className="nes-container is-rounded is-dark bg-yellow-400 text-black p-10 text-center animate-bounce">
            <h2 className="text-4xl mb-4"> KO! </h2>
            <p className="text-2xl">WINNER: {winner}</p>
            <button className="nes-btn is-primary mt-6" onClick={() => setWinner(null)}>AGAIN</button>
          </div>
        </div>
      )}

    </div>
  );
}