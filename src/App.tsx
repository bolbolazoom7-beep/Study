import React, { useState, useEffect, useRef, useCallback } from 'react';

type Stage = 'dot' | 'warning' | 'prank';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  color: string;
}

interface Ripple {
  id: number;
  size: number;
}

const ROOSTER_AUDIO_SOURCES = [
  '/rooster.mp3',
  '/assets/rooster.mp3',
  '/assets/aistudio/Chicken_on_tree_screaming_viral_sound_effect__Meme_sound_6e4d7d65.m4a'
];

const PRANK_LINES = [
  "هل انت عاجبك حالك؟",
  "عاجبك مستواك؟",
  "متروح تذاكر ياعلق واسترجل كدة",
  "روح بدل ٦٠% هتجيلك في الاخر",
  "وتروح قسم شم باط تامر الجيار",
  "وتقعد تندم وتلطم على خيبتك طول عمرك",
  "قوم فز ذاكر وبطل علوقية!"
];

const WARNING_TAP_THRESHOLD = 14;

export default function App() {
  const [tapCount, setTapCount] = useState<number>(0);
  const [stage, setStage] = useState<Stage>('dot');
  const [shakeClass, setShakeClass] = useState<string>('');
  const [showFlash, setShowFlash] = useState<boolean>(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [revealedLinesCount, setRevealedLinesCount] = useState<number>(0);
  const [muteAttemptMessage, setMuteAttemptMessage] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isTappingRef = useRef<boolean>(false);
  const shakeTimerRef = useRef<number | null>(null);
  const lineTimersRef = useRef<number[]>([]);
  const muteMsgTimerRef = useRef<number | null>(null);
  const audioSourceIndexRef = useRef<number>(0);

  // Clean up all timers and audio on unmount
  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      if (muteMsgTimerRef.current) clearTimeout(muteMsgTimerRef.current);
      lineTimersRef.current.forEach(t => clearTimeout(t));
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Initialize and preload audio
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';

    const tryLoadSource = (index: number) => {
      if (index >= ROOSTER_AUDIO_SOURCES.length) return;
      audioSourceIndexRef.current = index;
      audio.src = ROOSTER_AUDIO_SOURCES[index];
      audio.load();
    };

    audio.addEventListener('error', () => {
      tryLoadSource(audioSourceIndexRef.current + 1);
    });

    tryLoadSource(0);
    audioRef.current = audio;
  }, []);

  // Screen shake helper
  const triggerShake = useCallback((type: 'shake-light' | 'shake-medium' | 'shake-heavy' | 'shake-intense') => {
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    setShakeClass('');

    requestAnimationFrame(() => {
      setShakeClass(type);
      const duration = type === 'shake-light' ? 240 : type === 'shake-medium' ? 320 : type === 'shake-heavy' ? 420 : 580;
      shakeTimerRef.current = window.setTimeout(() => {
        setShakeClass('');
      }, duration);
    });
  }, []);

  // Particle emission
  const spawnParticles = useCallback((count: number) => {
    const newParticles: Particle[] = [];
    const colors = ['#A855F7', '#C084FC', '#E9D5FF', '#9333EA', '#7C3AED'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 40 + Math.random() * 90;
      newParticles.push({
        id: Date.now() + i + Math.random(),
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        vx: Math.cos(angle),
        vy: Math.sin(angle),
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    setParticles(newParticles);
    setTimeout(() => {
      setParticles([]);
    }, 700);
  }, []);

  // Ripple emission
  const spawnRipple = useCallback((size: number) => {
    const id = Date.now() + Math.random();
    setRipples(prev => [...prev.slice(-3), { id, size }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 750);
  }, []);

  // Relentless Audio Engine - Loops continuously without stopping
  const playRoosterContinuously = useCallback(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    audio.pause();
    audio.currentTime = 0;

    const playLoop = () => {
      const p = audio.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    };

    audio.onended = () => {
      // Immediately replay with virtually zero interruption
      audio.currentTime = 0;
      playLoop();
    };

    playLoop();
  }, []);

  // Trigger Final Prank Stage
  const triggerFinalPrank = useCallback(() => {
    setStage('prank');
    setShowFlash(true);
    triggerShake('shake-intense');

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([80, 50, 120, 60, 200]);
      } catch {}
    }

    setTimeout(() => {
      setShowFlash(false);
    }, 450);

    // Staggered reveal of all 7 lines
    lineTimersRef.current.forEach(t => clearTimeout(t));
    lineTimersRef.current = PRANK_LINES.map((_, index) => {
      return window.setTimeout(() => {
        setRevealedLinesCount(index + 1);
      }, 200 + index * 420);
    });

    // Start unstoppable screaming audio
    playRoosterContinuously();
  }, [triggerShake, playRoosterContinuously]);

  // Main tap handler with increased suspense and progression
  const handleTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    if (isTappingRef.current) return;
    isTappingRef.current = true;
    setTimeout(() => {
      isTappingRef.current = false;
    }, 200);

    if (stage === 'prank') return;

    const nextCount = tapCount + 1;
    setTapCount(nextCount);

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(nextCount >= 10 ? 50 : 25);
      } catch {}
    }

    if (stage === 'warning') {
      triggerFinalPrank();
      return;
    }

    // Progression with more taps
    if (nextCount < 3) {
      triggerShake('shake-light');
      spawnRipple(24 + nextCount * 12);
    } else if (nextCount < 6) {
      triggerShake('shake-light');
      spawnRipple(40 + nextCount * 14);
      spawnParticles(5 + nextCount);
    } else if (nextCount < 10) {
      triggerShake('shake-medium');
      spawnRipple(70 + nextCount * 15);
      spawnParticles(8 + nextCount);
    } else if (nextCount < WARNING_TAP_THRESHOLD) {
      triggerShake('shake-heavy');
      spawnRipple(120 + nextCount * 18);
      spawnParticles(12 + nextCount);
    } else {
      // Enter Warning Stage
      setStage('warning');
      triggerShake('shake-heavy');
      spawnRipple(280);
      spawnParticles(22);
    }
  }, [tapCount, stage, triggerShake, spawnRipple, spawnParticles, triggerFinalPrank]);

  // When user attempts to mute the sound - prank refuses to mute!
  const handleMuteAttempt = useCallback(() => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch {}
    }

    if (muteMsgTimerRef.current) clearTimeout(muteMsgTimerRef.current);
    setMuteAttemptMessage('مفيش قفل للصوت.. قوم ذاكر الأول!');

    muteMsgTimerRef.current = window.setTimeout(() => {
      setMuteAttemptMessage('');
    }, 2400);

    // Audio continues playing without stopping!
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    }
  }, []);

  // Reset / Replay from beginning
  const handleReplay = useCallback(() => {
    lineTimersRef.current.forEach(t => clearTimeout(t));
    lineTimersRef.current = [];
    if (muteMsgTimerRef.current) clearTimeout(muteMsgTimerRef.current);

    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setTapCount(0);
    setStage('dot');
    setShakeClass('');
    setShowFlash(false);
    setRipples([]);
    setParticles([]);
    setRevealedLinesCount(0);
    setMuteAttemptMessage('');
  }, []);

  // Compute visual circle size dynamically across the 14 progressive taps
  const getDotStyle = () => {
    if (stage === 'warning') {
      return {
        width: 'min(380px, 84vw)',
        height: 'min(380px, 84vw)',
        backgroundColor: 'rgba(26, 10, 46, 0.94)',
        borderColor: '#A855F7',
        borderWidth: '3.5px',
      };
    }

    if (tapCount === 0) {
      return {
        width: '4px',
        height: '4px',
        backgroundColor: '#A855F7',
      };
    }

    // Dynamic progression from 8px up to 260px
    const sizes = [
      4,    // 0
      8,    // 1
      14,   // 2
      22,   // 3
      32,   // 4
      46,   // 5
      62,   // 6
      82,   // 7
      105,  // 8
      132,  // 9
      162,  // 10
      196,  // 11
      230,  // 12
      265,  // 13
    ];

    const currentSize = sizes[Math.min(tapCount, sizes.length - 1)];
    const glowSpread = Math.min(60, 4 + tapCount * 4);
    const auraSpread = Math.min(100, 8 + tapCount * 7);

    return {
      width: `${currentSize}px`,
      height: `${currentSize}px`,
      backgroundColor: tapCount > 8 ? '#E9D5FF' : tapCount > 4 ? '#C084FC' : '#A855F7',
      boxShadow: `0 0 ${glowSpread}px ${Math.round(glowSpread / 3)}px #A855F7, 0 0 ${auraSpread}px ${Math.round(auraSpread / 3)}px rgba(109, 40, 217, 0.8)`,
    };
  };

  return (
    <main
      className={`fixed inset-0 w-full h-full bg-[#050407] overflow-hidden select-none flex items-center justify-center ${shakeClass}`}
      dir="rtl"
    >
      {/* Screen Purple Flash */}
      {showFlash && (
        <div className="fixed inset-0 z-50 pointer-events-none animate-purple-flash" />
      )}

      {/* Ambient Lighting for Final Prank */}
      {stage === 'prank' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-radial from-[#6D28D9]/40 via-[#A855F7]/15 to-transparent blur-3xl animate-ambient-glow" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90 pointer-events-none" />
        </div>
      )}

      {/* STAGE 0, 1, 2, 3: Interactive Dot / Circle Center */}
      {stage !== 'prank' && (
        <div className="relative flex items-center justify-center">
          {/* Subtle Ambient Radial Aura behind the dot as it escalates */}
          {tapCount > 0 && stage === 'dot' && (
            <div
              className="absolute rounded-full pointer-events-none transition-all duration-300"
              style={{
                width: `${Math.min(500, (tapCount + 1) * 38)}px`,
                height: `${Math.min(500, (tapCount + 1) * 38)}px`,
                background: `radial-gradient(circle, rgba(168, 85, 247, ${0.06 + tapCount * 0.03}) 0%, rgba(109, 40, 217, 0.03) 50%, transparent 70%)`,
              }}
            />
          )}

          {/* Expanding Ripples */}
          {ripples.map(ripple => (
            <div
              key={ripple.id}
              className="ripple-effect"
              style={{
                width: `${ripple.size * 2}px`,
                height: `${ripple.size * 2}px`,
              }}
            />
          ))}

          {/* Glowing Particles */}
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute rounded-full pointer-events-none transition-all duration-700 ease-out"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                boxShadow: `0 0 8px 2px ${p.color}`,
                transform: `translate(${p.x}px, ${p.y}px)`,
                opacity: 0,
              }}
            />
          ))}

          {/* Tap Target Wrapper */}
          <button
            type="button"
            onClick={handleTap}
            aria-label={stage === 'warning' ? 'متدوسش' : 'نقطة تفاعلية'}
            className="group relative flex items-center justify-center p-8 cursor-pointer focus:outline-none transition-transform active:scale-95 touch-manipulation"
            style={{
              minWidth: stage === 'warning' ? 'min(380px, 84vw)' : '64px',
              minHeight: stage === 'warning' ? 'min(380px, 84vw)' : '64px',
            }}
          >
            {/* The Dot or Warning Circle */}
            <div
              className={`rounded-full transition-all duration-300 ease-out flex flex-col items-center justify-center ${
                tapCount === 0 ? 'animate-dot-pulse' : ''
              } ${stage === 'warning' ? 'warning-circle-glow' : ''}`}
              style={getDotStyle()}
            >
              {/* STAGE 3: Warning Text Inside the Circle */}
              {stage === 'warning' && (
                <div className="flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none animate-fadeIn">
                  <h1 className="text-4xl md:text-5xl font-black text-white tracking-wider mb-3 neon-glow-text leading-tight">
                    متدوسش
                  </h1>
                  <p className="text-xl md:text-2xl font-bold text-purple-200 neon-glow-subtext">
                    أنا حذرتك
                  </p>
                </div>
              )}
            </div>
          </button>
        </div>
      )}

      {/* STAGE 4: Final Prank Screen */}
      {stage === 'prank' && (
        <section className="relative z-10 w-full max-w-4xl px-4 py-8 flex flex-col items-center justify-center text-center animate-fadeIn min-h-screen">
          {/* Mute Refusal Toast Notice */}
          {muteAttemptMessage && (
            <div className="fixed top-8 px-5 py-2.5 rounded-full bg-red-950/80 border border-red-500/50 text-red-200 text-sm md:text-base font-bold shadow-2xl backdrop-blur-md animate-bounce z-50">
              {muteAttemptMessage}
            </div>
          )}

          {/* Prank Lines Displayed In Sequence */}
          <div className="space-y-4 md:space-y-6 my-auto max-w-3xl">
            {PRANK_LINES.map((line, idx) => {
              if (idx >= revealedLinesCount) return null;

              // Distinct styles for escalation
              const isHeadline = idx === 0 || idx === 1;
              const isClimax = idx === 2 || idx === 6;

              return (
                <div
                  key={idx}
                  className={`transform transition-all duration-500 scale-100 opacity-100 translate-y-0 ${
                    isHeadline
                      ? 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white punch-line-1'
                      : isClimax
                      ? 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-red-300 punch-line-1'
                      : 'text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-purple-200 punch-line-2'
                  }`}
                >
                  {line}
                </div>
              );
            })}
          </div>

          {/* Discreet Bottom Controls */}
          <div className="fixed bottom-6 inset-x-0 flex items-center justify-center gap-4 px-4 z-20">
            {/* Fake Mute Button (Prank refuses to mute) */}
            <button
              type="button"
              onClick={handleMuteAttempt}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/70 border border-purple-500/30 text-xs sm:text-sm font-medium text-purple-200 hover:text-white hover:bg-purple-900/80 active:scale-95 transition-all shadow-lg backdrop-blur-md"
              aria-label="محاولة كتم الصوت"
            >
              <svg
                className="w-4 h-4 text-purple-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
              <span>كتم الصوت</span>
            </button>

            {/* Replay Button to reset */}
            <button
              type="button"
              onClick={handleReplay}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/70 border border-purple-500/30 text-xs sm:text-sm font-medium text-purple-200 hover:text-white hover:bg-purple-900/80 active:scale-95 transition-all shadow-lg backdrop-blur-md"
              aria-label="إعادة التجربة من الأول"
            >
              <svg
                className="w-4 h-4 text-purple-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>من الأول</span>
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
