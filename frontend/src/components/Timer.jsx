import React, { useEffect, useState, useRef } from 'react';
import { playDing } from '../utils/audio';
import { Play, Pause, RefreshCw } from 'lucide-react';

const Timer = ({ timerState, onSyncTimer, isCreator }) => {
  const [localRemaining, setLocalRemaining] = useState(timerState.remaining);
  const workerRef = useRef(null);
  const wakeLockRef = useRef(null);

  // Constants
  const RADIUS = 184;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~1156px

  useEffect(() => {
    // Setup Web Worker
    workerRef.current = new Worker(new URL('../utils/timerWorker.js', import.meta.url));
    workerRef.current.onmessage = (e) => {
      if (e.data.tick) {
        setLocalRemaining(prev => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }
    };
    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  useEffect(() => {
    // Sync local state when server state changes
    if (timerState.isRunning) {
      const elapsed = Math.floor((Date.now() - timerState.lastUpdateTime) / 1000);
      setLocalRemaining(Math.max(0, timerState.remaining - elapsed));
      workerRef.current.postMessage({ command: 'start' });
      requestWakeLock();
    } else {
      setLocalRemaining(timerState.remaining);
      workerRef.current.postMessage({ command: 'stop' });
      releaseWakeLock();
    }
  }, [timerState]);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (err) {
      console.log('Wake Lock error:', err);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  const handleComplete = () => {
    playDing();
    workerRef.current.postMessage({ command: 'stop' });
    
    if (!isCreator) return; // Only creator triggers the auto-transition sync

    // Auto transition logic
    let nextMode = timerState.mode === 'work' ? 'break' : 'work';
    let nextDuration = 5 * 60; // Default break

    if (timerState.mode === 'work') {
      // 5:1 ratio for study to break time
      nextDuration = Math.round(timerState.duration / 5);
    } else {
      // If coming from a break, default back to 25 mins work
      nextDuration = 25 * 60; 
    }

    onSyncTimer({
      isRunning: true,
      mode: nextMode,
      duration: nextDuration,
      remaining: nextDuration
    });
  };

  const toggleTimer = () => {
    onSyncTimer({
      ...timerState,
      isRunning: !timerState.isRunning,
      remaining: localRemaining
    });
  };

  const setOption = (workMins, breakMins) => {
    onSyncTimer({
      isRunning: false,
      mode: 'work',
      duration: workMins * 60,
      remaining: workMins * 60
    });
  };

  // Calculate SVG stroke offset
  const progress = localRemaining / timerState.duration;
  const strokeDashoffset = CIRCUMFERENCE - (progress * CIRCUMFERENCE);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="glass-panel timer-container">
      <div className="timer-options">
        <button className="option-btn" onClick={() => setOption(5, 5)}>5m Test</button>
        <button className="option-btn" onClick={() => setOption(25, 5)}>25/5</button>
        <button className="option-btn" onClick={() => setOption(50, 10)}>50/10</button>
      </div>

      <div className="timer-ring-wrapper">
        <svg viewBox="0 0 400 400" className="timer-svg">
          {/* Background Track (Bottom Layer) */}
          <circle cx="200" cy="200" r={RADIUS} className="timer-track" />
          
          {/* Primary Progress Arc (Middle Layer) */}
          <circle 
            cx="200" cy="200" r={RADIUS} 
            className={`timer-progress ${timerState.mode === 'break' ? 'break-mode' : ''}`}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
          />
          
          {/* Foreground Glow Arc (Top Layer) */}
          <circle 
            cx="200" cy="200" r={RADIUS} 
            className="timer-glow"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        <div className="timer-display">
          <div className="timer-time">{formatTime(localRemaining)}</div>
          <div className="timer-mode-text" style={{ color: timerState.mode === 'break' ? 'var(--break-color)' : 'var(--primary)'}}>
            {timerState.mode}
          </div>
        </div>
      </div>

      <div className="timer-controls">
        <button className="btn" onClick={toggleTimer} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {timerState.isRunning ? <Pause size={20} /> : <Play size={20} />}
          {timerState.isRunning ? 'Pause' : 'Start'}
        </button>
        <button className="btn" onClick={() => setOption(timerState.duration/60, 5)} style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
          <RefreshCw size={20} />
        </button>
      </div>
    </div>
  );
};

export default Timer;
