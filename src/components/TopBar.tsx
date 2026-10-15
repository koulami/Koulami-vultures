import React from 'react';
import { LayoutGrid, Users, MonitorPlay, ShieldCheck, QrCode, Clock, Play, Pause, Radio, Undo2, CheckCircle2 } from 'lucide-react';
import { ViewMode, Language, TimerState, GamePhase } from '../types/game';
import { translations } from '../locales/translations';

interface Props {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  timer: TimerState;
  phase: GamePhase;
  onToggleTimer?: () => void;
  onOpenJoinQr?: () => void;
  onSimultaneousStart?: () => void;
  canUndo?: boolean;
  onUndo?: () => void;
}

export const TopBar: React.FC<Props> = ({
  viewMode,
  onViewModeChange,
  lang,
  onLanguageChange,
  timer,
  phase,
  onToggleTimer,
  onOpenJoinQr,
  onSimultaneousStart,
  canUndo,
  onUndo
}) => {
  const t = translations[lang];

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimeCritical = timer.remainingSeconds > 0 && timer.remainingSeconds <= 60;
  const isTimeEnded = timer.remainingSeconds === 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Zone 1: Brand Title & Phase Badge */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shadow-amber-500/20">
            B
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap">
            BoundPad
          </span>

          {phase === 'waiting_lobby' && (
            <span className="hidden xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-[10px] font-bold text-rose-300">
              <Radio className="w-2.5 h-2.5 animate-pulse text-rose-500" />
              <span>{t.phaseLobby}</span>
            </span>
          )}
        </div>

        {/* Zone 2: Navigation Links (Padlet, Team, Projector, Facilitator) */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => onViewModeChange('padlet_board')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              viewMode === 'padlet_board'
                ? 'bg-slate-800 text-amber-400 font-bold border border-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{t.navBoard}</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('team_play')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              viewMode === 'team_play'
                ? 'bg-slate-800 text-amber-400 font-bold border border-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.navTeamPlay}</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('projector')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              viewMode === 'projector'
                ? 'bg-slate-800 text-amber-400 font-bold border border-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <MonitorPlay className="w-3.5 h-3.5" />
            <span>{t.navProjector}</span>
          </button>

          {/* Facilitator / Admin Button - Always Visible & Highly Distinct */}
          <button
            type="button"
            onClick={() => onViewModeChange('admin')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm ${
              viewMode === 'admin'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 ring-2 ring-amber-400'
                : 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 border border-amber-500/50 hover:border-amber-400'
            }`}
            title={lang === 'el' ? 'Κονσόλα Διαχειριστή: Επεξεργασία όλων των ερωτήσεων, ομάδων, φωτογραφιών και ρυθμίσεων' : 'Facilitator Console: Edit questions, teams, photos, and settings'}
          >
            <ShieldCheck className={`w-4 h-4 ${viewMode === 'admin' ? 'text-slate-950' : 'text-amber-400'}`} />
            <span>{lang === 'el' ? '⚙️ Διαχειριστής' : '⚙️ Facilitator'}</span>
          </button>
        </nav>

        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Undo Action Button (Active whenever changes can be reverted) */}
          {onUndo && (
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${
                canUndo
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/40 hover:border-amber-400 shadow-sm active:scale-95'
                  : 'bg-slate-800/40 text-slate-500 border-slate-800 opacity-40 cursor-not-allowed'
              }`}
              title={canUndo ? t.undoLastChange : (lang === 'el' ? 'Δεν υπάρχει ενέργεια προς αναίρεση' : 'No action to undo')}
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.undo}</span>
            </button>
          )}

          {/* Autosave subtle status badge */}
          <div
            className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-[11px] font-medium text-emerald-400 select-none"
            title={lang === 'el' ? 'Όλες οι αλλαγές αποθηκεύονται αυτόματα και προστατεύονται' : 'All changes are autosaved and protected'}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>{t.autoSaved}</span>
          </div>

          {/* Quick Start if Lobby */}
          {phase === 'waiting_lobby' && onSimultaneousStart && (
            <button
              type="button"
              onClick={onSimultaneousStart}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer animate-pulse"
              title={t.simultaneousStart}
            >
              <Play className="w-3 h-3 fill-slate-950" />
              <span>{lang === 'el' ? 'Εκκίνηση' : 'Start'}</span>
            </button>
          )}

          {/* Quick Join QR modal trigger */}
          {onOpenJoinQr && (
            <button
              type="button"
              onClick={onOpenJoinQr}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 transition-colors cursor-pointer"
              title={t.showJoinQr}
            >
              <QrCode className="w-4 h-4" />
            </button>
          )}

          {/* Synchronized Countdown Indicator */}
          <div
            onClick={onToggleTimer}
            className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer select-none ${
              isTimeEnded
                ? 'bg-rose-950/80 border-rose-600 text-rose-300 ring-1 ring-rose-500 animate-pulse'
                : isTimeCritical
                ? 'bg-amber-950/80 border-amber-500 text-amber-300 ring-1 ring-amber-500 animate-pulse'
                : timer.isRunning
                ? 'bg-slate-800/90 border-emerald-500/60 text-emerald-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-300'
            }`}
            title={timer.isRunning ? t.pauseTimer : t.startTimer}
          >
            <Clock className={`w-3.5 h-3.5 ${timer.isRunning ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span className="tabular-nums tracking-wider text-xs sm:text-sm">
              {formatTimer(timer.remainingSeconds)}
            </span>
            {onToggleTimer && (
              <span className="text-[10px] text-slate-400 hover:text-white hidden sm:inline ml-0.5">
                {timer.isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </span>
            )}
          </div>

          {/* Bilingual Language Switcher */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => onLanguageChange('el')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                lang === 'el'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Ελληνικά"
            >
              ΕΛ
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                lang === 'en'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="English"
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
