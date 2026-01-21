"use client";
import { useState } from 'react';
import { getPlayerStats } from '../lib/github';
import "nes.css/css/nes.min.css"; 

export default function Home() {
  const [username, setUsername] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFight = async () => {
    if (!username) return;
    setLoading(true);
    // Fetch data from our API helper
    const data = await getPlayerStats(username);
    setStats(data);
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-10 font-mono">
      {/* The Container */}
      <div className="nes-container is-dark with-title" style={{ width: '600px', backgroundColor: '#212529'}}>
        <p className="title">Git Battle Arena</p>
        
        {/* The Input Field */}
        <div className="nes-field is-inline flex gap-4">
          <input 
            type="text" 
            className="nes-input is-dark" 
            placeholder="GitHub Username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button 
            className={`nes-btn ${loading ? 'is-disabled' : 'is-primary'}`} 
            onClick={handleFight}
          >
            {loading ? '...' : 'SCAN'}
          </button>
        </div>

        {/* The Player Card (Only shows after data loads) */}
        {stats && (
          <div className="mt-10 flex gap-6 items-center border-t border-gray-700 pt-6 animate-pulse">
            {/* Avatar */}
            <img 
              src={stats.avatarUrl} 
              alt="avatar" 
              className="w-24 h-24 border-4 border-white" 
              style={{imageRendering: 'pixelated'}}
            />
            
            {/* Stats Block */}
            <div className="flex-1 w-full">
              <h3 className="text-xl mb-4 text-green-400">{stats.login}</h3>
              
              {/* HP Bar */}
              <div className="mb-4">
                <span className="text-red-500 mb-1 block">HP (Followers): {stats.followers.totalCount}</span>
                <progress className="nes-progress is-error h-6 w-full" value={stats.followers.totalCount} max="1000"></progress>
              </div>

              {/* Speed Bar */}
              <div>
                <span className="text-yellow-400 mb-1 block">SPD (Commits): {stats.contributionsCollection.contributionCalendar.totalContributions}</span>
                <progress className="nes-progress is-warning h-6 w-full" value={stats.contributionsCollection.contributionCalendar.totalContributions} max="2000"></progress>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}