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
        if (data1.followers.totalCount > data2.followers.totalCount) setWinner(data1.login);
        else if (data2.followers.totalCount > data1.followers.totalCount) setWinner(data2.login);
        else setWinner("DRAW");
      }, 800);
    }
  };

  const resetGame = () => {
    setWinner(null);
    setStats1(null);
    setStats2(null);
    setP1('');
    setP2('');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#212529', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'monospace' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ color: '#f7d51d', fontSize: '3rem', marginBottom: '10px' }}>GIT BATTLE</h1>
        <p style={{ color: '#aaa' }}>8-BIT WARFARE</p>
      </div>

      {/* BATTLE ARENA */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
        
        {/* PLAYER 1 CARD */}
        <div className={`nes-container is-dark with-title ${fighting ? 'fight-left' : ''}`} style={{ width: '350px', height: '450px', display: 'flex', flexDirection: 'column', transition: 'transform 0.5s' }}>
          <p className="title" style={{ color: '#3b82f6' }}>Player 1</p>
          {!stats1 ? (
             <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
               <input type="text" className="nes-input is-dark" placeholder="Github Username" value={p1} onChange={(e) => setP1(e.target.value)} />
             </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <img 
                src={stats1.avatarUrl} 
                alt="P1" 
                style={{ width: '150px', height: '150px', border: '4px solid white', margin: '0 auto', display: 'block' }} 
              />
              <h2 style={{ color: '#60a5fa', marginTop: '15px', fontSize: '1.5rem' }}>{stats1.login}</h2>
              <div style={{ marginTop: '20px', textAlign: 'left', background: '#333', padding: '10px' }}>
                <p style={{ color: '#ef4444', fontSize: '0.8rem' }}>HP: {stats1.followers.totalCount}</p>
                <progress className="nes-progress is-error" value={stats1.followers.totalCount} max="5000" style={{ height: '20px' }}></progress>
              </div>
            </div>
          )}
        </div>

        {/* VS BUTTON */}
        <div style={{ zIndex: 10 }}>
           {fighting ? <span style={{ fontSize: '4rem' }}>💥</span> : 
             <button onClick={handleBattle} className={`nes-btn ${loading ? 'is-disabled' : 'is-error'}`}>VS</button>
           }
        </div>

        {/* PLAYER 2 CARD */}
        <div className={`nes-container is-dark with-title ${fighting ? 'fight-right' : ''}`} style={{ width: '350px', height: '450px', display: 'flex', flexDirection: 'column', transition: 'transform 0.5s' }}>
          <p className="title" style={{ color: '#ef4444' }}>Player 2</p>
          {!stats2 ? (
             <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
               <input type="text" className="nes-input is-dark" placeholder="Github Username" value={p2} onChange={(e) => setP2(e.target.value)} />
             </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <img 
                src={stats2.avatarUrl} 
                alt="P2" 
                style={{ width: '150px', height: '150px', border: '4px solid white', margin: '0 auto', display: 'block' }} 
              />
              <h2 style={{ color: '#f87171', marginTop: '15px', fontSize: '1.5rem' }}>{stats2.login}</h2>
              <div style={{ marginTop: '20px', textAlign: 'left', background: '#333', padding: '10px' }}>
                <p style={{ color: '#ef4444', fontSize: '0.8rem' }}>HP: {stats2.followers.totalCount}</p>
                <progress className="nes-progress is-error" value={stats2.followers.totalCount} max="5000" style={{ height: '20px' }}></progress>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* WINNER OVERLAY */}
      {winner && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="nes-container is-rounded is-dark" style={{ border: '4px solid #f7d51d', padding: '40px', textAlign: 'center', backgroundColor: '#212529' }}>
            <h2 style={{ color: '#f7d51d', fontSize: '3rem', marginBottom: '20px' }}>🏆 WINNER 🏆</h2>
            <p style={{ color: 'white', fontSize: '2rem', marginBottom: '30px' }}>{winner}</p>
            <button className="nes-btn is-primary" onClick={resetGame}>NEW FIGHT</button>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style jsx global>{`
        .fight-left { transform: translateX(50px) rotate(10deg); }
        .fight-right { transform: translateX(-50px) rotate(-10deg); }
      `}</style>
    </div>
  );
}