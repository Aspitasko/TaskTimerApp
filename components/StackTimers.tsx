import React, { useState } from 'react';
import { TimerStack, StackedTimer } from '../types';
import { TrashIcon, PlusIcon } from './Icons';

interface StackTimersProps {
  stacks: TimerStack[];
  onCreateStack: (stack: TimerStack) => void;
  onDeleteStack: (stackId: string) => void;
  onRunStack: (stackId: string) => void;
  isFloating?: boolean; // For top-right button style
}

export default function StackTimers({ stacks, onCreateStack, onDeleteStack, onRunStack, isFloating = false }: StackTimersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stackName, setStackName] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [stackedTimers, setStackedTimers] = useState<StackedTimer[]>([]);
  const [duration, setDuration] = useState('');
  const [note, setNote] = useState('');
  const [phaseName, setPhaseName] = useState('');

  const addTimerToStack = () => {
    if (!duration || parseInt(duration) <= 0) return;
    
    const newStackedTimer: StackedTimer = {
      id: Date.now().toString(),
      duration: parseInt(duration) * 60, // Convert minutes to seconds
      note: phaseName || `Phase ${stackedTimers.length + 1}`,
      description: note || undefined,
      order: stackedTimers.length,
    };
    
    setStackedTimers([...stackedTimers, newStackedTimer]);
    setDuration('');
    setNote('');
    setPhaseName('');
  };

  const removeTimerFromStack = (timerId: string) => {
    setStackedTimers(stackedTimers.filter(t => t.id !== timerId).map((t, idx) => ({ ...t, order: idx })));
  };

  const createStack = () => {
    if (!stackName || stackedTimers.length === 0) return;
    
    const newStack: TimerStack = {
      id: Date.now().toString(),
      name: stackName,
      timers: stackedTimers,
      isRecurring,
      createdAt: Date.now(),
    };
    
    onCreateStack(newStack);
    
    // Reset form
    setStackName('');
    setIsRecurring(false);
    setStackedTimers([]);
    setDuration('');
    setNote('');
    setPhaseName('');
    setIsOpen(false);
  };

  const resetForm = () => {
    setStackName('');
    setIsRecurring(false);
    setStackedTimers([]);
    setDuration('');
    setNote('');
    setPhaseName('');
    setIsOpen(false);
  };

  return (
    <>
      {/* Stack Timers Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${
          isFloating
            ? 'px-3 py-2 rounded-full bg-[#111]/80 backdrop-blur-md border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-all text-sm font-medium'
            : 'w-full px-4 md:px-6 py-3 md:py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold transition-all duration-300'
        } flex items-center justify-center gap-2 ${isFloating ? '' : 'shadow-lg hover:shadow-xl'}`}
      >
        <PlusIcon className={`${isFloating ? 'w-4 h-4' : 'w-5 h-5'}`} />
        <span className={isFloating ? 'hidden sm:inline' : ''}>Stack</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="bg-[#111] border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl m-auto">
            {/* Modal Header */}
            <div className="bg-[#111] border-b border-neutral-800 px-6 py-5 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-bold text-white">Create Timer Stack</h2>
              <button
                onClick={resetForm}
                className="text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all text-2xl w-9 h-9 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Input Form */}
                <div className="space-y-5">
                  {/* Stack Name Input */}
                  <div>
                    <label className="block text-neutral-400 text-sm font-medium mb-2">Stack Name</label>
                    <input
                      type="text"
                      value={stackName}
                      onChange={(e) => setStackName(e.target.value)}
                      placeholder="e.g., Exam Day Schedule"
                      className="w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Recurring Toggle */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900/30 border border-neutral-800">
                    <input
                      type="checkbox"
                      id="recurring"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="w-4 h-4 rounded bg-neutral-900 border border-neutral-700 cursor-pointer accent-blue-600"
                    />
                    <label htmlFor="recurring" className="text-neutral-300 text-sm font-medium cursor-pointer flex-1">
                      Recurring Stack
                    </label>
                  </div>

                  {/* Add Phase Form */}
                  <div className="p-5 rounded-lg bg-neutral-900/50 border border-neutral-800 space-y-3">
                      <h4 className="text-sm font-semibold text-white mb-3">Add Phase</h4>
                      
                      <div>
                        <label className="block text-neutral-400 text-xs font-medium mb-1.5">Phase Name (optional)</label>
                        <input
                          type="text"
                          value={phaseName}
                          onChange={(e) => setPhaseName(e.target.value)}
                          placeholder="e.g., Reading Time"
                          className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-400 text-xs font-medium mb-1.5">Duration (minutes)</label>
                        <input
                          type="number"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          placeholder="15"
                          min="1"
                          className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-neutral-400 text-xs font-medium mb-1.5">Description/Note</label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="What happens during this phase?"
                          className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm resize-none transition-all"
                          rows={2}
                        />
                      </div>

                      <button
                        onClick={addTimerToStack}
                        disabled={!duration || parseInt(duration) <= 0}
                        className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-neutral-700 disabled:to-neutral-700 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 disabled:shadow-none"
                      >
                        + Add Phase
                      </button>
                  </div>
                </div>

                {/* Right: Timeline Preview */}
                <div className="flex flex-col h-full">
                  <h3 className="text-lg font-semibold text-white mb-4">Timeline Preview</h3>
                  
                  {stackedTimers.length === 0 ? (
                    <div className="p-8 rounded-lg bg-neutral-900/30 border border-neutral-800 border-dashed flex flex-col items-center justify-center min-h-[200px]">
                      <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-neutral-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <p className="text-neutral-500 text-sm text-center">Add phases to see timeline</p>
                    </div>
                  ) : (
                    <div className="space-y-3 flex-1 overflow-y-auto pr-3 custom-scrollbar">
                      {stackedTimers.map((timer, idx) => {
                        const totalMinutesBefore = stackedTimers.slice(0, idx).reduce((sum, t) => sum + Math.floor(t.duration / 60), 0);
                        const durationMinutes = Math.floor(timer.duration / 60);
                        
                        return (
                          <div key={timer.id} className="relative">
                            {/* Timeline connector */}
                            {idx > 0 && (
                              <div className="absolute left-[19px] -top-3 w-[2px] h-3 bg-gradient-to-b from-blue-500 to-transparent"></div>
                            )}

                            {/* Phase card */}
                            <div className="relative p-4 pl-12 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all group">
                              {/* Timeline number */}
                              <div className="absolute left-3 top-4">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 border-2 border-[#111] flex items-center justify-center text-xs font-bold text-white shadow-lg">
                                  {idx + 1}
                                </div>
                              </div>

                              {/* Phase name and time */}
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="text-white font-semibold text-sm">
                                    {timer.note || `Phase ${idx + 1}`}
                                  </h4>
                                  <p className="text-blue-400 text-xs mt-1 font-medium">
                                    {durationMinutes}m {durationMinutes >= 60 ? `(${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m)` : ''}
                                  </p>
                                </div>
                                <button
                                  onClick={() => removeTimerFromStack(timer.id)}
                                  className="p-1.5 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-all text-sm flex-shrink-0"
                                  title="Remove phase"
                                >
                                  ✕
                                </button>
                              </div>

                              {/* When does it start */}
                              <div className="mt-2 pt-2 border-t border-neutral-800">
                                <p className="text-xs text-neutral-400">
                                  {idx === 0 ? (
                                    <span className="text-green-400 font-medium inline-flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                                      </svg>
                                      Starts immediately
                                    </span>
                                  ) : (
                                    <>
                                      Starts after{' '}
                                      <span className="text-yellow-400 font-semibold">
                                        {totalMinutesBefore}m
                                      </span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Total time */}
                      {stackedTimers.length > 0 && (
                        <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-800/50 sticky bottom-0 backdrop-blur-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-300 font-medium text-sm">Total Duration</span>
                            <span className="text-white font-bold text-lg">
                              {(() => {
                                const totalSeconds = stackedTimers.reduce((sum, t) => sum + t.duration, 0);
                                const hours = Math.floor(totalSeconds / 3600);
                                const minutes = Math.floor((totalSeconds % 3600) / 60);
                                return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                              })()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons - Sticky Footer */}
            <div className="border-t border-neutral-800 bg-[#111] px-6 py-5 flex gap-3 flex-shrink-0">
              <button
                onClick={resetForm}
                className="flex-1 px-5 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={createStack}
                disabled={!stackName || stackedTimers.length === 0}
                className="flex-1 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-neutral-700 disabled:to-neutral-700 disabled:cursor-not-allowed text-white font-bold transition-all shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Create Stack
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}