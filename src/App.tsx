import React, { useState, useEffect } from 'react';
import ShotPutScene from './components/ShotPutScene';
import FaceTracker from './components/FaceTracker';
import { useSoundEffects } from './hooks/useSoundEffects';
// import { powerToDistance } from './lib/expressionScore';

const App: React.FC = () => {
  const [power, setPower] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'throwing' | 'result'>('idle');
  const [currentFaceScore, setCurrentFaceScore] = useState<number>(0);
  const [hasStarted, setHasStarted] = useState(false);

  const { playPowerTone, stopPowerTone, playThrowSound, playLandSound } = useSoundEffects();

  // Sound Effect for Power Charging
  useEffect(() => {
    if (gameState === 'idle') {
      playPowerTone(currentFaceScore);
    } else {
      stopPowerTone();
    }
  }, [currentFaceScore, gameState, playPowerTone, stopPowerTone]);

  const throwBall = () => {
    setGameState('throwing');
    setDistance(null); // Reset distance display
    // playThrowSound(); // Moved to onThrow callback in ShotPutScene
    
    // Use Face Score for Power
    // Score is 0.0 to 1.0
    // Min Power: 10, Max Power: 35 (World Record level)
    const minPower = 10;
    const maxPower = 35;
    const p = minPower + (maxPower - minPower) * currentFaceScore;
    
    console.log(`Throwing with Score: ${currentFaceScore.toFixed(2)}, Power: ${p.toFixed(2)}`);
    setPower(p);
  };

  const handleLand = (d: number) => {
    playLandSound();
    setDistance(d);
    setGameState('result');
  };

  const reset = () => {
    setPower(null);
    setDistance(null);
    setGameState('idle');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Face Tracker Debug View */}
      <FaceTracker 
        isActive={gameState === 'idle'} 
        onScoreUpdate={setCurrentFaceScore} 
      />

      {/* 3D Scene Background */}
      <div className="absolute inset-0 z-0">
        <ShotPutScene 
            power={power} 
            onLand={handleLand} 
            onThrow={playThrowSound}
        />
      </div>

      {/* HUD Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Header */}
        <header className="flex justify-between items-start">
          <div className="bg-black/50 backdrop-blur-md p-4 rounded-xl border border-white/20 text-white">
            <h1 className="text-2xl font-bold tracking-wider uppercase text-yellow-400">Hammer Throw Pro</h1>
            <p className="text-xs text-gray-300">Face Tracking: <span className="text-green-400">ONLINE</span></p>
          </div>
          
          {/* Score / Distance Display */}
          {distance !== null && (
             <div className="bg-black/70 backdrop-blur-md p-6 rounded-xl border-2 border-yellow-500 text-center animate-bounce-in">
                <div className="text-sm text-gray-400 uppercase tracking-widest">Distance</div>
                <div className="text-5xl font-black text-white font-mono">
                  {distance.toFixed(2)}<span className="text-2xl text-yellow-500 ml-1">m</span>
                </div>
             </div>
          )}
        </header>

        {/* Controls (Bottom) */}
        <footer className="flex justify-center items-end pb-8 pointer-events-auto">
          {gameState === 'idle' && (
            <button 
              onClick={throwBall}
              className="group relative px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl uppercase tracking-widest rounded-full shadow-lg shadow-yellow-500/50 transition-all transform hover:scale-105 active:scale-95"
            >
              <span className="relative z-10">Throw!</span>
              <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </button>
          )}

          {gameState === 'result' && (
            <button 
              onClick={reset}
              className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg uppercase tracking-wider rounded-full border border-gray-600 shadow-lg transition-all"
            >
              Try Again
            </button>
          )}
          
          {gameState === 'throwing' && (
             <div className="text-white text-xl font-bold animate-pulse bg-black/50 px-6 py-2 rounded-full">
               Throwing...
             </div>
          )}
        </footer>
      </div>

      {/* Start Overlay */}
      {!hasStarted && (
        <div 
            className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-md cursor-pointer p-4"
            onClick={() => setHasStarted(true)}
        >
            <div className="text-center w-full max-w-lg">
                {/* Title Section */}
                <div className="mb-8 relative">
                    <div className="absolute -inset-4 bg-yellow-400/10 blur-xl rounded-full"></div>
                    <h1 className="relative text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 italic tracking-tighter drop-shadow-sm">
                        激闘！<br/>変顔ハンマー
                    </h1>
                    <p className="text-xl text-white font-bold italic mt-2 tracking-widest opacity-90">
                        FACE ATHLETE 2025
                    </p>
                </div>

                {/* Instructions Card */}
                <div className="bg-black/40 p-6 rounded-2xl border-2 border-yellow-400/50 shadow-lg backdrop-blur-sm space-y-6 relative overflow-hidden">
                    
                    <div className="space-y-4 relative z-10">
                        <h3 className="text-2xl font-bold text-white">
                            <span className="text-cyan-400">顔面</span>でパワーを溜めろ！
                        </h3>
                        <div className="text-base text-gray-100 font-bold leading-relaxed space-y-2">
                            <p className="bg-white/5 inline-block px-3 py-1 rounded">
                                目を<span className="text-yellow-400 text-xl mx-1">カッ！</span>と見開き
                            </p>
                            <br/>
                            <p className="bg-white/5 inline-block px-3 py-1 rounded">
                                口を<span className="text-red-400 text-xl mx-1">ガバッ！</span>と開ける
                            </p>
                        </div>
                        <p className="text-xs text-yellow-200/80">
                            ※恥じらいは捨ててください
                        </p>
                    </div>
                    
                    <div className="w-full h-px bg-white/10"></div>

                    <div className="relative z-10">
                        <p className="text-lg text-white font-bold italic">
                            最高の<span className="text-pink-500">変顔</span>のまま<br/>
                            <span className="inline-block bg-yellow-500 text-black px-4 py-1 rounded mt-2 font-black">THROW</span> ボタンを叩け！
                        </p>
                    </div>
                </div>

                {/* Click to Start */}
                <div className="mt-8 animate-pulse">
                    <p className="text-2xl font-black text-white tracking-widest">
                        CLICK TO START
                    </p>
                    <p className="text-xs text-cyan-300/80 font-bold mt-1 tracking-wider">
                        SOUND & CAMERA ON
                    </p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
