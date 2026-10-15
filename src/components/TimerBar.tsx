import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Clock, Settings, Volume2 } from 'lucide-react';
import { TimerState, Language } from '../types/game';
import { translations } from '../locales/translations';
import { sound } from '../services/sound';

interface Props {
  timer: TimerState;
  lang: Language;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSetDuration: (seconds: number) => void;
  isAdmin?: boolean;
}

export const TimerBar: React.FC<Props> = ({
  timer,
  lang,
  onStart,
  onPause,
  onReset,
  onSetDuration,
  isAdmin = false
}) => {
  const t = translations[lang];
  const [showDurationSettings, setShowDurationSettings] = useState<boolean>(false);
  const [customMinutes, setCustomMinutes] = useState<string>('20');

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = timer.totalSeconds > 0
    ? Math.max(0, Math.min(100, (timer.remainingSeconds / timer.totalSeconds) * 100))
    : 0;

  const isTimeCritical = timer.remainingSeconds > 0 && timer.remainingSeconds <= 60;
  const isTimeEnded = timer.remainingSeconds === 0;

  const handleApplyDuration = (minutes: number) => {
    onSetDuration(minutes * 60);
    setShowDurationSettings(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Timer Display */}
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-all ${
              isTimeEnded
                ? 'bg-rose-950 border border-rose-600 text-rose-400 animate-bounce'
                : isTimeCritical
                ? 'bg-amber-950 border border-amber-500 text-amber-400 animate-pulse'
                : timer.isRunning
                ? 'bg-emerald-950 border border-emerald-500 text-emerald-400'
                : 'bg-slate-800 border border-slate-700 text-slate-300'
            }`}
          >
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>{t.timerTitle}</span>
              <span className="text-slate-600">·</span>
              <span className={`font-semibold ${
                timer.isRunning ? 'text-emerald-400' : 'text-slate-400'
              }`}>
                {isTimeEnded ? t.timerEnded : timer.isRunning ? t.timerRunning : t.timerPaused}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-slate-100 tabular-nums">
              {formatTimer(timer.remainingSeconds)}
            </div>
          </div>
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {timer.isRunning ? (
              <button
                type="button"
                onClick={onPause}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-amber-500/10"
              >
                <Pause className="w-4 h-4" />
                <span>{t.pauseTimer}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStart}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-500/10"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>{t.startTimer}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onReset}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              title={t.resetTimer}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowDurationSettings(!showDurationSettings)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              title={t.setTimerDuration}
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => sound.playTimerAlert()}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              title="Test sound"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isTimeEnded
              ? 'bg-rose-500'
              : isTimeCritical
              ? 'bg-amber-500 animate-pulse'
              : 'bg-emerald-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Preset Duration Selector Popover */}
      {showDurationSettings && isAdmin && (
        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1">{t.setTimerDuration}:</span>
          {[5, 10, 15, 20, 30].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => handleApplyDuration(mins)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
            >
              {mins} {t.minutes}
            </button>
          ))}
          <div className="flex items-center gap-1 ml-auto">
            <input
              type="number"
              min="1"
              max="180"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="w-14 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 text-center font-mono"
            />
            <button
              type="button"
              onClick={() => handleApplyDuration(parseInt(customMinutes, 10) || 10)}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
            >
              {t.save}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
