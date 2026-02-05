'use client';

import { useState, useEffect } from 'react';
import useSound from 'use-sound';

export default function BackgroundMusic() {
    const [play, { stop, sound }] = useSound('/sounds/battle-theme.mp3', {
        loop: true,
        volume: 0.3,
    });

    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
    const handleFirstInteraction = () => {
      play();
      setIsPlaying(true);

      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    
    const timer = setTimeout(() => {
      try {
        play();
        setIsPlaying(true);
        
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
      } catch (e) {
        console.log("Autoplay blocked by browser - waiting for click");
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [play]);

    // toggle function(music on/off)
    const toggleMusic = () => {
        if (isPlaying) {
            stop();
            setIsPlaying(false);
        } else {
            play();
            setIsPlaying(true);
        }
    };

    return (
        <div className='fixed bottom-4 left-4 z-50'>
            <button
                onClick={toggleMusic}
                className={`
                    retro-font text-xs md:text-sm uppercase tracking-wider
                    border-2 border-black px-4 py-3 transition-all duration-100
                    shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                    hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
                    active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                    ${isPlaying
                        ? 'bg-green-500 text-black'
                        :'bg-gray-800 text-gray-400'
                    }
                `}
            >
                <div className='flex items-center gap-2'>
                    {isPlaying ? (
                        <>
                            <span className='animate-pulse'>🔊</span>
                            <span>Music: ON</span>
                        </>
                    ) : (
                        <>
                            <span>🔇</span>
                            <span>Music: OFF</span>
                        </>
                    )}
                </div>
            </button>
        </div>
    );
}