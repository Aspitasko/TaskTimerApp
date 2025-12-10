import React, { useState, useEffect } from 'react';
import { Timer, TimerType, Preset, TimerStack, StackedTimer } from './types';
import TimerCard from './components/TimerCard';
import DynamicIsland from './components/DynamicIsland';
import AddTimer from './components/AddTimer';
import Weather from './components/Weather';
import StackTimers from './components/StackTimers';
import { MaximizeIcon, MinimizeIcon } from './components/Icons';

function App() {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [lastTick, setLastTick] = useState<number>(Date.now());
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [fullDate, setFullDate] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isClockFullscreen, setIsClockFullscreen] = useState(false);
  const [customPresets, setCustomPresets] = useState<Preset[]>([]);
  const [clockReminder, setClockReminder] = useState<string>("");
  const [showReminderInput, setShowReminderInput] = useState(false);
  const [reminderText, setReminderText] = useState<string>("");
  const [timerStacks, setTimerStacks] = useState<TimerStack[]>([]);

  // --- Clock ---
  useEffect(() => {
    const updateTime = () => {
        const now = new Date();
        const hour = now.getHours();
        
        // Determine greeting
        let greet = '';
        if (hour >= 5 && hour < 12) {
          greet = 'Good Morning';
        } else if (hour >= 12 && hour < 17) {
          greet = 'Good Afternoon';
        } else if (hour >= 17 && hour < 21) {
          greet = 'Good Evening';
        } else {
          greet = 'Good Night';
        }
        
        setCurrentTime(now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }));
        // Compact date for mobile, full for desktop if needed
        setCurrentDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
        // Full date for fullscreen mode
        setFullDate(now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
        setGreeting(greet);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Fullscreen Handler ---
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        setIsClockFullscreen(false);
        setShowReminderInput(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // --- Clock Fullscreen Handler ---
  const clockRef = React.useRef<HTMLDivElement>(null);

  const toggleClockFullscreen = async () => {
    if (!document.fullscreenElement) {
      if (clockRef.current) {
        try {
          await clockRef.current.requestFullscreen();
          setIsClockFullscreen(true);
        } catch (err) {
          console.error("Error attempting to enable clock fullscreen:", err);
        }
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsClockFullscreen(false);
      }
    }
  };

  // --- Persistence ---
  useEffect(() => {
    const savedTimers = localStorage.getItem('chronos_timers');
    if (savedTimers) {
      try {
        const parsed = JSON.parse(savedTimers);
        if (Array.isArray(parsed) && parsed.length > 0) {
            setTimers(parsed);
        } else {
            initializeDefaultTimer();
        }
      } catch (e) { initializeDefaultTimer(); }
    } else {
         initializeDefaultTimer();
    }

    const savedPresets = localStorage.getItem('chronos_presets');
    if (savedPresets) {
        try {
            setCustomPresets(JSON.parse(savedPresets));
        } catch (e) { console.error(e); }
    }

    // Load clock reminder
    const savedReminder = localStorage.getItem('clock_reminder');
    if (savedReminder) {
      setClockReminder(savedReminder);
    }

    // Load timer stacks
    const savedStacks = localStorage.getItem('chronos_stacks');
    if (savedStacks) {
      try {
        setTimerStacks(JSON.parse(savedStacks));
      } catch (e) { console.error(e); }
    }
  }, []);

  const initializeDefaultTimer = () => {
     setTimers([{
        id: crypto.randomUUID(),
        type: 'TIMER',
        label: 'Timer 1',
        initialDuration: 300,
        remainingTime: 300,
        elapsedTime: 0,
        isRunning: false,
        isCompleted: false,
        createdAt: Date.now()
    }]);
  }

  useEffect(() => {
    if (timers.length > 0) {
        localStorage.setItem('chronos_timers', JSON.stringify(timers));
    }
  }, [timers]);

  useEffect(() => {
    if (timerStacks.length > 0) {
      localStorage.setItem('chronos_stacks', JSON.stringify(timerStacks));
    }
  }, [timerStacks]);

  // --- Ticker ---
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = (now - lastTick) / 1000;
      setLastTick(now);

      setTimers(prevTimers => {
        const updatedTimers = prevTimers.map(timer => {
          if (!timer.isRunning || timer.isCompleted) return timer;

          if (timer.type === 'STOPWATCH') {
            return { ...timer, elapsedTime: timer.elapsedTime + deltaSeconds };
          } else {
            const newRemaining = Math.max(0, timer.remainingTime - deltaSeconds);
            const isFinished = newRemaining <= 0;
            
            // If this timer just finished and it's part of a stack with more phases
            if (isFinished && timer.stackPhases && timer.currentPhaseIndex !== undefined) {
              const nextPhaseIndex = timer.currentPhaseIndex + 1;
              
              if (nextPhaseIndex < timer.stackPhases.length) {
                // Move to next phase - update the same timer
                const nextPhase = timer.stackPhases[nextPhaseIndex];
                const stackName = timer.label.split(' - ')[0]; // Extract stack name
                const newLabel = `${stackName} - ${nextPhase.note || `Phase ${nextPhaseIndex + 1}`}`;
                
                return {
                  ...timer,
                  label: newLabel,
                  initialDuration: nextPhase.duration,
                  remainingTime: nextPhase.duration,
                  currentPhaseIndex: nextPhaseIndex,
                  note: nextPhase.description || undefined,
                  isCompleted: false,
                  isRunning: true // Keep running into next phase
                };
              } else {
                // All phases complete
                return { 
                  ...timer, 
                  remainingTime: 0, 
                  isCompleted: true,
                  isRunning: false
                };
              }
            }
            
            return { 
              ...timer, 
              remainingTime: newRemaining, 
              isCompleted: isFinished,
              isRunning: !isFinished
            };
          }
        });
        return updatedTimers;
      });
    }, 100);

    return () => clearInterval(intervalId);
  }, [lastTick]);


  // --- Actions ---
  const addTimer = (type: TimerType, duration: number, label: string, note?: string, stackData?: { stackId: string, phases: StackedTimer[] }) => {
    const newTimer: Timer = {
      id: crypto.randomUUID(),
      type: type,
      label: label,
      initialDuration: duration,
      remainingTime: duration,
      elapsedTime: 0,
      isRunning: false,
      isCompleted: false,
      createdAt: Date.now(),
      pomodoroType: type === 'POMODORO' ? 'FOCUS' : undefined,
      note: note,
      stackId: stackData?.stackId,
      stackPhases: stackData?.phases,
      currentPhaseIndex: stackData ? 0 : undefined
    };
    setTimers(prev => [...prev, newTimer]);
    return newTimer.id;
  };

  const toggleTimer = (id: string) => {
    setTimers(prev => prev.map(t => 
      t.id === id ? { ...t, isRunning: !t.isRunning } : t
    ));
  };

  const resetTimer = (id: string) => {
    setTimers(prev => prev.map(t => 
      t.id === id ? { 
        ...t, 
        remainingTime: t.initialDuration, 
        elapsedTime: 0, 
        isCompleted: false, 
        isRunning: false 
      } : t
    ));
  };

  const deleteTimer = (id: string) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  };

  const updateTimer = (id: string, updates: Partial<Timer>) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }

  const handleSavePreset = (preset: Preset) => {
      const updated = [...customPresets, preset];
      setCustomPresets(updated);
      localStorage.setItem('chronos_presets', JSON.stringify(updated));
  };

  const handleDeletePreset = (label: string) => {
      const updated = customPresets.filter(p => p.label !== label);
      setCustomPresets(updated);
      localStorage.setItem('chronos_presets', JSON.stringify(updated));
  }

  const handleAddStack = (stack: TimerStack) => {
    setTimerStacks(prev => [...prev, stack]);
  };

  const handleDeleteStack = (stackId: string) => {
    setTimerStacks(prev => prev.filter(s => s.id !== stackId));
  };

  const handleRunStack = (stackId: string) => {
    const stack = timerStacks.find(s => s.id === stackId);
    if (!stack) return;

    if (stack.isRecurring) {
      // For recurring stacks, create one timer that represents the whole stack
      const totalDuration = stack.timers.reduce((sum, t) => sum + t.duration, 0);
      const phasesList = stack.timers.map((t, i) => `${i + 1}. ${t.note || `Phase ${i + 1}`} (${Math.floor(t.duration / 60)}m)`).join('\n');
      const note = `Recurring Stack\n\n${phasesList}`;
      
      const newTimerId = addTimer('TIMER', totalDuration, stack.name, note);
      if (newTimerId) {
        setTimeout(() => toggleTimer(newTimerId), 100);
      }
    } else {
      // For non-recurring stacks, create ONE timer that will progress through phases
      const firstPhase = stack.timers[0];
      const firstPhaseName = firstPhase.note || 'Phase 1';
      const label = `${stack.name} - ${firstPhaseName}`;
      const note = firstPhase.description || undefined;
      
      const newTimerId = addTimer(
        'TIMER',
        firstPhase.duration,
        label,
        note,
        { stackId: stackId, phases: stack.timers }
      );
      
      // Start the timer
      if (newTimerId) {
        setTimeout(() => toggleTimer(newTimerId), 100);
      }
    }
  };
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        const running = timers.find(t => t.isRunning);
        if (running) {
            toggleTimer(running.id);
        } else if (timers.length > 0) {
            toggleTimer(timers[0].id);
        }
      }

      if (e.code === 'KeyR') {
         const running = timers.find(t => t.isRunning);
         if (running) {
             resetTimer(running.id);
         } else if (timers.length > 0) {
             resetTimer(timers[0].id);
         }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timers]);

  const activeTimer = timers.find(t => t.isRunning) || timers[0];

  return (
    <div className="w-full min-h-screen bg-[#050505] relative flex flex-col font-sans selection:bg-white/20">
      
      {/* Dynamic Island Status - Fixed on top */}
      <DynamicIsland onAdd={addTimer} activeTimer={activeTimer} />

      {/* Header controls (Top Right) */}
      <div className="fixed top-6 right-6 md:top-10 md:right-10 z-50 animate-fade-in flex flex-col items-end gap-3 md:flex-row md:items-center md:gap-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2">
            {/* Stack Timers Button */}
            <div className="flex">
              <StackTimers 
                stacks={timerStacks}
                onCreateStack={handleAddStack}
                onDeleteStack={handleDeleteStack}
                onRunStack={handleRunStack}
                isFloating={true}
              />
            </div>

            {/* Weather */}
            <Weather />

            {/* Clock & Date */}
            <div 
              ref={clockRef}
              onClick={toggleClockFullscreen}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-[#111]/80 backdrop-blur-md border border-neutral-800 flex items-center gap-2 md:gap-3 justify-center text-neutral-400 shadow-lg text-xs md:text-sm cursor-pointer hover:border-neutral-600 transition-colors
                ${isClockFullscreen 
                  ? 'fixed inset-0 z-50 w-full h-full justify-center items-center rounded-none border-none text-6xl md:text-8xl' 
                  : ''
                }`}
            >
              {isClockFullscreen ? (
                <div className="flex flex-col items-center justify-center gap-8 w-full h-full relative">
                  <div className="text-neutral-400 font-sans text-3xl md:text-5xl font-light tracking-wide mb-4">
                    {greeting}
                  </div>
                  <div className="font-mono text-white font-medium tracking-wider text-6xl md:text-8xl">
                    {currentTime}
                  </div>
                  <div className="text-neutral-400 font-sans text-xl md:text-2xl font-medium mt-8">
                    {fullDate}
                  </div>
                  <div className="mt-8 flex justify-center">
                    <Weather />
                  </div>

                  {/* Reminder Display */}
                  {clockReminder && (
                    <div className="mt-12 px-8 py-6 rounded-2xl bg-neutral-900/80 border border-neutral-700 backdrop-blur-md max-w-2xl mx-auto relative group">
                      <div className="text-neutral-500 text-sm font-medium mb-2 uppercase tracking-wider">Reminder</div>
                      <div className="text-white text-2xl md:text-3xl font-light text-center leading-relaxed">
                        {clockReminder}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setClockReminder('');
                          localStorage.removeItem('clock_reminder');
                        }}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-neutral-600 hover:text-red-500 text-lg"
                        title="Remove Reminder"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Bottom Controls */}
                  <div className="absolute bottom-8 right-8 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    {!showReminderInput ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowReminderInput(true);
                        }}
                        className="p-3 rounded-full bg-[#111]/80 backdrop-blur-md border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors flex items-center justify-center w-12 h-12"
                        title="Add Reminder"
                      >
                        <span className="text-2xl leading-none">+</span>
                      </button>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={reminderText}
                          onChange={(e) => setReminderText(e.target.value)}
                          placeholder="Enter reminder..."
                          className="px-4 py-2 rounded-full bg-[#111]/80 backdrop-blur-md border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 text-sm"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (reminderText.trim()) {
                                setClockReminder(reminderText);
                                localStorage.setItem('clock_reminder', reminderText);
                              }
                              setReminderText('');
                              setShowReminderInput(false);
                            }
                          }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (reminderText.trim()) {
                              setClockReminder(reminderText);
                              localStorage.setItem('clock_reminder', reminderText);
                            }
                            setReminderText('');
                            setShowReminderInput(false);
                          }}
                          className="px-4 py-2 rounded-full bg-white text-black hover:bg-neutral-200 transition-colors font-medium text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowReminderInput(false);
                            setReminderText('');
                          }}
                          className="p-1.5 rounded-full bg-neutral-900/80 border border-neutral-700 text-neutral-400 hover:text-white transition-colors text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleClockFullscreen();
                      }}
                      className="p-3 rounded-full bg-[#111]/80 backdrop-blur-md border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
                      title="Exit Clock View"
                    >
                      <MinimizeIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="font-medium text-neutral-500 whitespace-nowrap">{currentDate}</span>
                  <span className="w-px h-3 bg-neutral-800"></span>
                  <span className="font-mono text-neutral-300">{currentTime}</span>
                </>
              )}
            </div>
          </div>
      </div>

      {/* Fullscreen Toggle (Bottom Right) */}
      <button 
        onClick={toggleFullscreen}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 p-3 md:p-4 rounded-full bg-[#111]/80 backdrop-blur-md border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors shadow-lg hover:bg-neutral-900/80"
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {isFullscreen ? <MinimizeIcon className="w-5 h-5 md:w-6 md:h-6" /> : <MaximizeIcon className="w-5 h-5 md:w-6 md:h-6" />}
      </button>

      {/* Left Sidebar - Saved Stacks */}
      {timerStacks.length > 0 && (
        <div className="fixed left-6 top-32 bottom-24 z-40 w-64 overflow-y-auto hidden lg:block">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-neutral-400 mb-4 uppercase tracking-wider">Saved Stacks</h3>
            {timerStacks.map((stack) => (
              <div key={stack.id} className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-all hover:shadow-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-sm">{stack.name}</h4>
                    <p className="text-neutral-400 text-xs mt-1.5 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                        </svg>
                        {stack.timers.length} phase{stack.timers.length !== 1 ? 's' : ''}
                      </span>
                      {stack.isRecurring && (
                        <span className="text-purple-400 inline-flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                          </svg>
                          Recurring
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteStack(stack.id)}
                    className="p-1.5 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Delete stack"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-1.5 mb-3 p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
                  {stack.timers.map((timer, idx) => (
                    <div key={timer.id} className="text-xs text-neutral-300 flex items-start gap-2">
                      <span className="text-blue-400 font-semibold min-w-[16px]">{idx + 1}.</span>
                      <span className="flex-1">
                        <span className="text-white font-medium">{timer.note || `Phase ${idx + 1}`}</span>
                        <span className="text-blue-300"> • {Math.floor(timer.duration / 60)}m</span>
                        {timer.description && <span className="text-neutral-400 block mt-0.5 text-[10px]">{timer.description}</span>}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleRunStack(stack.id)}
                  className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold transition-all text-xs shadow-lg hover:shadow-green-600/30 flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                  </svg>
                  Run Stack
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable Main Content */}
      <div className="flex-grow flex flex-col items-center w-full relative z-10 px-6 md:px-8 pt-32 md:pt-40 pb-24 md:pb-32">
        
        {/* Timer Grid */}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-10 lg:gap-12 w-full max-w-[1400px]">
            {timers.map(timer => (
                <TimerCard
                    key={timer.id}
                    timer={timer}
                    onToggle={toggleTimer}
                    onReset={resetTimer}
                    onDelete={deleteTimer}
                    onUpdate={updateTimer}
                />
            ))}
        </div>

        {/* Add Timer Button Area */}
        <div className="mt-16 md:mt-20 lg:mt-24 mb-12 w-full max-w-[1400px]">
            <AddTimer 
                onAdd={addTimer} 
                customPresets={customPresets} 
                onSavePreset={handleSavePreset}
                onDeletePreset={handleDeletePreset}
                onAddStack={handleAddStack}
                onDeleteStack={handleDeleteStack}
                onRunStack={handleRunStack}
                stacks={timerStacks}
            />
        </div>

        {/* Footer */}
        <footer className="mt-auto pt-8 md:pt-12 pb-4 text-center">
            <p className="text-neutral-700 text-xs md:text-sm font-medium">Made by Mistiz911 and Aspitasko</p>
        </footer>

      </div>

    </div>
  );
}

export default App;