import React, { useState } from 'react';
import {
  Trash2, RotateCcw, Plus, Edit3, QrCode, Printer, CheckCircle2,
  AlertTriangle, Users, Award, ShieldAlert, Sparkles, Download, Upload,
  Image as ImageIcon, Power, Eye, EyeOff, Check, ArrowLeft,
  ArrowUp, ArrowDown, Shuffle, Lock, Unlock, Copy, Layers, Filter, Undo2, ShieldCheck,
  Loader2
} from 'lucide-react';
import { GameState, Language, Question, Team, QuestionType, GamePhase } from '../types/game';
import { translations } from '../locales/translations';
import { TimerBar } from './TimerBar';
import { QuestionEditorModal } from './QuestionEditorModal';
import { TeamQuestSequenceManager } from './TeamQuestSequenceManager';
import { TeamEditorModal } from './TeamEditorModal';
import { getTeamOrderedQuestions, isTeamSequentialProgression } from '../utils/questOrder';
import { syncService } from '../services/storage';
import { ScannableQrImage } from './ScannableQrImage';
import { translateGreekToEnglish } from '../utils/translator';

interface Props {
  gameState: GameState;
  lang: Language;
  onLanguageChange?: (lang: Language) => void;
  onResetAllSubmissions: () => void;
  onResetTeamSubmissions: (teamId: string) => void;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  onSetTimerDuration: (seconds: number) => void;
  onAddQuestion: (q: Question) => void;
  onUpdateQuestion: (q: Question) => void;
  onDeleteQuestion: (qId: string) => void;
  onToggleQuestionActive: (qId: string) => void;
  onAddTeam: (team: Team) => void;
  onUpdateTeam: (team: Team) => void;
  onDeleteTeam: (teamId: string) => void;
  onSetPhase: (phase: GamePhase) => void;
  onSetSynthesisPrompt: (prompt: string, promptEn?: string) => void;
  onOpenJoinQr: () => void;
  onSetTeamQuestionOrder: (teamId: string, questionIds: string[]) => void;
  onSetTeamSequentialMode: (teamId: string, isSequential: boolean) => void;
  onApplyOrderToAllTeams: (questionIds: string[]) => void;
  onApplyStationRotation: () => void;
  canUndo?: boolean;
  onUndo?: () => void;
  onRestoreBackup?: (backupState: GameState) => void;
  onRestoreDefaultQuests?: () => void;
  onBulkAutoTranslate?: () => void;
  onClose?: () => void;
}

export const AdminPanel: React.FC<Props> = ({
  gameState,
  lang,
  onLanguageChange,
  onResetAllSubmissions,
  onResetTeamSubmissions,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onSetTimerDuration,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onToggleQuestionActive,
  onAddTeam,
  onUpdateTeam,
  onDeleteTeam,
  onSetPhase,
  onSetSynthesisPrompt,
  onOpenJoinQr,
  onSetTeamQuestionOrder,
  onSetTeamSequentialMode,
  onApplyOrderToAllTeams,
  onApplyStationRotation,
  canUndo,
  onUndo,
  onRestoreBackup,
  onRestoreDefaultQuests,
  onBulkAutoTranslate,
  onClose
}) => {
  const t = translations[lang];

  const [confirmResetAll, setConfirmResetAll] = useState<boolean>(false);
  const [selectedTeamToReset, setSelectedTeamToReset] = useState<string>('');
  const [resetNotification, setResetNotification] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null | 'new'>(null);
  const [editorInitialTab, setEditorInitialTab] = useState<'both' | 'el' | 'en'>('both');
  const [isBulkTranslating, setIsBulkTranslating] = useState<boolean>(false);
  const [showQrPrintModal, setShowQrPrintModal] = useState<boolean>(false);
  const [editingTeam, setEditingTeam] = useState<Team | null | 'new'>(null);
  const [promptText, setPromptText] = useState<string>(gameState.synthesisPrompt || '');
  const [promptTextEn, setPromptTextEn] = useState<string>(gameState.synthesisPrompt_en || '');
  const [selectedTeamTab, setSelectedTeamTab] = useState<string>(gameState.teams[0]?.id || 'all');
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  const handleExecuteResetAll = () => {
    onResetAllSubmissions();
    setConfirmResetAll(false);
    setResetNotification(t.clearSuccess);
    setTimeout(() => setResetNotification(null), 4000);
  };

  const handleExecuteResetTeam = () => {
    if (!selectedTeamToReset) return;
    onResetTeamSubmissions(selectedTeamToReset);
    setSelectedTeamToReset('');
    setResetNotification(t.clearSuccess);
    setTimeout(() => setResetNotification(null), 4000);
  };

  // Reorder a question up/down for a specific team
  const handleMoveTeamQuestion = (teamId: string, index: number, direction: 'up' | 'down') => {
    const teamObj = gameState.teams.find((t) => t.id === teamId);
    if (!teamObj) return;
    const currentOrdered = getTeamOrderedQuestions(
      teamObj,
      gameState.questions,
      gameState.teamQuestionOrders,
      true // include inactive so admin can manage all
    );
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentOrdered.length) return;

    const newOrder = [...currentOrdered.map((q) => q.id)];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    onSetTeamQuestionOrder(teamId, newOrder);
  };

  // Shuffle order for a specific team
  const handleShuffleTeam = (teamId: string) => {
    const teamObj = gameState.teams.find((t) => t.id === teamId);
    if (!teamObj) return;
    const currentOrdered = getTeamOrderedQuestions(
      teamObj,
      gameState.questions,
      gameState.teamQuestionOrders,
      true
    );
    const ids = [...currentOrdered.map((q) => q.id)];
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    onSetTeamQuestionOrder(teamId, ids);
    setResetNotification(
      lang === 'el'
        ? `Η σειρά δραστηριοτήτων για την ομάδα «${teamObj.name}» ανακατεύτηκε!`
        : `Order shuffled for team «${teamObj.name}»!`
    );
    setTimeout(() => setResetNotification(null), 3500);
  };

  // Reset to default order for a specific team
  const handleResetTeamOrder = (teamId: string) => {
    const defaultIds = gameState.questions
      .filter((q) => {
        if (!q.assignedTeamIds || q.assignedTeamIds.length === 0) return true;
        return q.assignedTeamIds.includes(teamId);
      })
      .map((q) => q.id);
    onSetTeamQuestionOrder(teamId, defaultIds);
    setResetNotification(
      lang === 'el' ? 'Επαναφορά στην αρχική σειρά' : 'Reset to default order'
    );
    setTimeout(() => setResetNotification(null), 3500);
  };

  // Remove question from a specific team
  const handleRemoveQuestionFromTeam = (quest: Question, teamId: string) => {
    const isAll = !quest.assignedTeamIds || quest.assignedTeamIds.length === 0 || quest.assignedTeamIds.length === gameState.teams.length;
    if (isAll) {
      // It was assigned to all teams, now assign to all EXCEPT teamId
      const remainingTeamIds = gameState.teams.map((t) => t.id).filter((id) => id !== teamId);
      onUpdateQuestion({
        ...quest,
        assignedTeamIds: remainingTeamIds
      });
    } else {
      const remainingTeamIds = (quest.assignedTeamIds || []).filter((id) => id !== teamId);
      if (remainingTeamIds.length === 0) {
        // Only this team had it -> delete question
        onDeleteQuestion(quest.id);
      } else {
        onUpdateQuestion({
          ...quest,
          assignedTeamIds: remainingTeamIds
        });
      }
    }
  };

  // Find QR code questions for print stations
  const qrQuestions = gameState.questions.filter(q => q.type === 'qr_scan');

  // Active team selection and derived data
  const activeTeam = gameState.teams.find((t) => t.id === selectedTeamTab);
  const teamQuestions = activeTeam
    ? getTeamOrderedQuestions(activeTeam, gameState.questions, gameState.teamQuestionOrders, true)
    : [];
  const isSequential = activeTeam
    ? isTeamSequentialProgression(activeTeam, gameState.teamSequentialModes)
    : false;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-start sm:items-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title={t.backToBoard}
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">{t.backToBoard}</span>
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2.5">
              <span>{t.adminDashboard}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              {lang === 'el'
                ? 'Διαχειριστείτε πλήρως δραστηριότητες, ονόματα ομάδων, φωτογραφίες, ενεργοποίηση/απενεργοποίηση και χρονόμετρο.'
                : 'Full management for quest activities, team names, photos, enable/disable toggles, and countdown timer.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Undo Action Button */}
          {onUndo && (
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                canUndo
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 shadow-sm active:scale-95'
                  : 'bg-slate-800/50 text-slate-500 border border-slate-800 opacity-40 cursor-not-allowed'
              }`}
              title={canUndo ? t.undoLastChange : (lang === 'el' ? 'Δεν υπάρχει ενέργεια προς αναίρεση' : 'No action to undo')}
            >
              <Undo2 className="w-4 h-4" />
              <span>{t.undo}</span>
            </button>
          )}

          {/* Autosaved Indicator */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
            title={lang === 'el' ? 'Αυτόματη αποθήκευση σε κάθε αλλαγή. Τα δεδομένα σας είναι πλήρως ασφαλή!' : 'Auto-saved on every change. Your data is protected!'}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.autoSaved}</span>
          </div>

          {/* Export JSON backup button */}
          <button
            type="button"
            onClick={() => {
              syncService.exportBackupFile(gameState);
              setResetNotification(
                lang === 'el'
                  ? 'Το αντίγραφο ασφαλείας λήφθηκε με επιτυχία στον υπολογιστή σας!'
                  : 'Backup file exported successfully!'
              );
              setTimeout(() => setResetNotification(null), 4000);
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title={t.exportBackup}
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span className="hidden md:inline">{lang === 'el' ? 'Λήψη Αντιγράφου' : 'Export'}</span>
          </button>

          {/* Browser snapshot history recovery button */}
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title={lang === 'el' ? 'Προβολή ιστορικού στιγμιοτύπων περιηγητή για ανάκτηση προηγούμενης κατάστασης' : 'View browser snapshot history to restore a previous state'}
          >
            <RotateCcw className="w-4 h-4 text-purple-400" />
            <span className="hidden md:inline">{lang === 'el' ? 'Ιστορικό Στιγμιοτύπων' : 'History'}</span>
          </button>

          {/* Hidden file input for restore JSON */}
          {onRestoreBackup && (
            <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">{lang === 'el' ? 'Επαναφορά' : 'Restore'}</span>
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    try {
                      const parsed = JSON.parse(evt.target?.result as string);
                      if (parsed && parsed.questions && parsed.teams) {
                        onRestoreBackup(parsed);
                        setResetNotification(
                          lang === 'el'
                            ? 'Το αντίγραφο ασφαλείας επαναφέρθηκε με επιτυχία!'
                            : 'Backup restored successfully!'
                        );
                        setTimeout(() => setResetNotification(null), 4000);
                      }
                    } catch {
                      alert(lang === 'el' ? 'Μη έγκυρο αρχείο JSON αντιγράφου.' : 'Invalid backup JSON file.');
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
          )}

          {onRestoreDefaultQuests && (
            <button
              type="button"
              onClick={() => {
                onRestoreDefaultQuests();
                setResetNotification(
                  lang === 'el'
                    ? 'Όλες οι αρχικές δραστηριότητες (συμπεριλαμβανομένης της Ομάδας 4) ανακτήθηκαν επιτυχώς!'
                    : 'All default quests (including Team 4) recovered successfully!'
                );
                setTimeout(() => setResetNotification(null), 4000);
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title={lang === 'el' ? 'Ανάκτηση τυχόν χαμένων αρχικών δραστηριοτήτων' : 'Recover default quests'}
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">{lang === 'el' ? 'Ανάκτηση Αρχικών' : 'Recover Defaults'}</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="sm:hidden px-3 py-1.5 rounded-xl bg-slate-800 text-amber-300 text-xs font-bold border border-slate-700 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.backToBoard}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenJoinQr}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>{t.showJoinQr}</span>
          </button>

          {qrQuestions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowQrPrintModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-purple-400" />
              <span>{t.printQrStationCards}</span>
            </button>
          )}
        </div>
      </div>

      {/* Bilingual Feature Banner: Greek & English Translations */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-800/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <span className="text-3xl p-2.5 rounded-2xl bg-slate-950 border border-sky-800/60 shrink-0">
            🌐
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 flex-wrap">
              <span>{lang === 'el' ? 'Δίγλωσση Λειτουργία & Μετάφραση (Greek + English)' : 'Bilingual Engine (Greek + English)'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                {lang === 'el' ? '✓ Ενεργή' : '✓ Active'}
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {lang === 'el'
                ? 'Όλες οι δραστηριότητες που έχετε γράψει διαθέτουν αγγλική μετάφραση! Δείτε παρακάτω την αγγλική απόδοση σε κάθε κάρτα και πατήστε «🇬🇧 Τελικό Editing» για να κάνετε τις δικές σας τελικές διορθώσεις.'
                : 'All activities include their English translations! You can view the English version below on every card and click "🇬🇧 Edit English" to perform your final touch-ups.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {onBulkAutoTranslate && (
            <button
              type="button"
              onClick={() => {
                onBulkAutoTranslate();
                setResetNotification(
                  lang === 'el'
                    ? '✓ Όλες οι δραστηριότητες και τα κείμενα μεταφράστηκαν αυτόματα στα Αγγλικά και αποθηκεύτηκαν!'
                    : '✓ All quests and texts were auto-translated to English and saved!'
                );
                setTimeout(() => setResetNotification(null), 4000);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:to-indigo-400 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-sky-500/25 cursor-pointer active:scale-95"
              title={lang === 'el' ? 'Μαζική αυτόματη μετάφραση όλων των ερωτήσεων στα Αγγλικά' : 'Auto-translate all questions to English'}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{lang === 'el' ? '⚡ Μαζική Μετάφραση Όλων στα Αγγλικά' : '⚡ Auto-Translate All to English'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Game Phase & Flow Controller */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span>{t.gamePhase}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                gameState.phase === 'waiting_lobby'
                  ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                  : gameState.phase === 'in_progress'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : gameState.phase === 'synthesis'
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                  : 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
              }`}>
                {t[`phase${gameState.phase === 'waiting_lobby' ? 'Lobby' : gameState.phase === 'in_progress' ? 'InProgress' : gameState.phase === 'synthesis' ? 'Synthesis' : 'Discussion'}` as keyof typeof t] || gameState.phase}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'el'
                ? 'Ελέγξτε τη ροή: Αίθουσα αναμονής → Ταυτόχρονη εκκίνηση → Σύνθεση στον πίνακα ομάδας → Συζήτηση στην τάξη.'
                : 'Control flow: Waiting lobby → Simultaneous start → Team synthesis board → Class discussion.'}
            </p>
          </div>

          {/* Quick Primary Flow Action */}
          <div>
            {gameState.phase === 'waiting_lobby' && (
              <button
                type="button"
                onClick={() => {
                  onSetPhase('in_progress');
                  onStartTimer();
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer animate-pulse"
              >
                <span>{t.simultaneousStart}</span>
              </button>
            )}

            {gameState.phase === 'in_progress' && (
              <button
                type="button"
                onClick={() => onSetPhase('synthesis')}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <span>{t.moveToSynthesis}</span>
              </button>
            )}

            {gameState.phase === 'synthesis' && (
              <button
                type="button"
                onClick={() => onSetPhase('discussion')}
                className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer"
              >
                <span>{t.openDiscussion}</span>
              </button>
            )}

            {gameState.phase === 'discussion' && (
              <button
                type="button"
                onClick={() => onSetPhase('waiting_lobby')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-2 border border-slate-700 cursor-pointer"
              >
                <span>{t.resetToLobby}</span>
              </button>
            )}
          </div>
        </div>

        {/* Phase Step Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {[
            { id: 'waiting_lobby', label: t.phaseLobby, num: '1' },
            { id: 'in_progress', label: t.phaseInProgress, num: '2' },
            { id: 'synthesis', label: t.phaseSynthesis, num: '3' },
            { id: 'discussion', label: t.phaseDiscussion, num: '4' }
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => onSetPhase(st.id as GamePhase)}
              className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                gameState.phase === st.id
                  ? 'bg-amber-950/40 border-amber-500 text-amber-200 ring-2 ring-amber-500/30 font-bold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] font-mono flex items-center justify-center font-bold">
                  {st.num}
                </span>
                <span className="truncate">{st.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Synthesis Prompt Customizer (Bilingual) */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="block text-xs font-bold text-slate-300">
              {lang === 'el' ? 'Κεντρικό Ερώτημα / Οδηγία Σύνθεσης Πληροφοριών Ομάδων:' : 'Central Team Synthesis Question & Clue Prompt:'}
            </label>
            <button
              type="button"
              onClick={() => {
                onSetSynthesisPrompt(promptText, promptTextEn);
                setResetNotification(lang === 'el' ? '✓ Η οδηγία σύνθεσης αποθηκεύτηκε επιτυχώς!' : '✓ Synthesis prompt saved successfully!');
                setTimeout(() => setResetNotification(null), 3500);
              }}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 cursor-pointer transition-all self-end sm:self-auto"
            >
              {t.save}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div>
              <span className="text-[10px] text-slate-400 block mb-1 font-semibold">🇬🇷 Ελληνική Έκδοση</span>
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="π.χ. Συνθέστε τις πληροφορίες και τα συμπεράσματα από τις αποστολές..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <span className="text-[10px] text-sky-400 block mb-1 font-semibold">🇬🇧 English Translation (Τελική Επεξεργασία)</span>
              <input
                type="text"
                value={promptTextEn}
                onChange={(e) => setPromptTextEn(e.target.value)}
                placeholder="e.g. Synthesize your team findings and clues from the quests..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-sky-600/70 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>
        </div>
      </div>

      {resetNotification && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-sm flex items-center gap-2 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{resetNotification}</span>
        </div>
      )}

      {/* Countdown Timer Facilitator Control */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">{t.timerTitle}</h2>
        <TimerBar
          timer={gameState.timer}
          lang={lang}
          isAdmin={true}
          onStart={onStartTimer}
          onPause={onPauseTimer}
          onReset={onResetTimer}
          onSetDuration={onSetTimerDuration}
        />
      </div>

      {/* Danger Zone: Reset Answers */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-rose-900/40 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 text-rose-400">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-sm font-bold uppercase tracking-wider">{t.dangerZone}</h2>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {lang === 'el'
            ? 'Όταν ξεκινάτε ένα νέο παιχνίδι ή επόμενο γύρο στην τάξη, σβήστε όλες τις προηγούμενες απαντήσεις, φωτογραφίες και σκορ με ένα κλικ.'
            : 'When starting a fresh game or next class round, wipe all previous answers, photo submissions, and team scores with a single click.'}
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          {/* Reset All */}
          {confirmResetAll ? (
            <div className="flex items-center gap-2 bg-rose-950 p-2 rounded-xl border border-rose-600">
              <span className="text-xs text-rose-200 font-medium px-2">{t.resetAllAnswersConfirm}</span>
              <button
                type="button"
                onClick={handleExecuteResetAll}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                {t.confirm}
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetAll(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                {t.cancel}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmResetAll(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-rose-900/20"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t.resetAllAnswers}</span>
            </button>
          )}

          {/* Reset Single Team */}
          <div className="flex items-center gap-2 sm:ml-auto">
            <select
              value={selectedTeamToReset}
              onChange={(e) => setSelectedTeamToReset(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none"
            >
              <option value="">{t.selectTeamToReset}</option>
              {gameState.teams.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedTeamToReset}
              onClick={handleExecuteResetTeam}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1 inline" />
              {t.resetSingleTeam}
            </button>
          </div>
        </div>
      </div>

      {/* Team-Centric Activity & Question Manager */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>{lang === 'el' ? '🎯 Δραστηριότητες & Ερωτήσεις ανά Ομάδα' : '🎯 Team Activities & Quests'}</span>
              <span className="text-xs text-slate-500 font-normal">
                ({gameState.questions.filter(q => q.isActive !== false).length}/{gameState.questions.length} {lang === 'el' ? 'ενεργές' : 'active'})
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'el'
                ? 'Επιλέξτε ομάδα για να διαχειριστείτε και να αλλάξετε τη σειρά (πάνω/κάτω) των δραστηριοτήτων της ξεχωριστά, ή προσθέστε νέα δραστηριότητα με επιλογή περάσματος και στις υπόλοιπες ομάδες.'
                : 'Select a team to manage and reorder (up/down) its activities independently, or add new quests with the option to pass them to other teams.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setEditingQuestion('new')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-amber-500/10 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeTeam && selectedTeamTab !== 'all'
                ? (lang === 'el' ? `+ Νέα για ${activeTeam.name.split(':')[0]}` : `+ New for ${activeTeam.name.split(':')[0]}`)
                : t.addQuestionBtn}
            </span>
          </button>
        </div>

        {/* Bilingual Helper & Language Switch Bar */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/70 via-slate-900 to-indigo-950/70 border border-sky-500/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-300 text-lg shrink-0">
              🇬🇧
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs font-bold text-sky-200">
                  {lang === 'el' ? 'Αγγλικές Μεταφράσεις & Τελικό Editing' : 'English Translations & Final Editing'}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  ✓ {lang === 'el' ? 'Όλες οι δραστηριότητες έχουν μεταφραστεί στα Αγγλικά' : 'All quests translated to English'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                {lang === 'el'
                  ? 'Όλες οι δραστηριότητες (και της Ομάδας 4) έχουν αυτόματη μετάφραση. Πατήστε «🇬🇧 Τελικό Editing» σε οποιαδήποτε δραστηριότητα για να ανοίξει απευθείας η αγγλική καρτέλα για τις δικές σας διορθώσεις, ή αλλάξτε την προβολή στα Αγγλικά παρακάτω:'
                  : 'All activities (including Team 4) have automated translations. Click "🇬🇧 Edit EN" on any quest to open the English tab for your final edits, or toggle English view below:'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
            {onLanguageChange && (
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-700 shadow-inner">
                <button
                  type="button"
                  onClick={() => onLanguageChange('el')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    lang === 'el'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Προβολή στα Ελληνικά"
                >
                  <span>🇬🇷</span>
                  <span>Ελληνικά</span>
                </button>
                <button
                  type="button"
                  onClick={() => onLanguageChange('en')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    lang === 'en'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Switch whole view to English"
                >
                  <span>🇬🇧</span>
                  <span>English View</span>
                </button>
              </div>
            )}

            {onBulkAutoTranslate && (
              <button
                type="button"
                disabled={isBulkTranslating}
                onClick={async () => {
                  setIsBulkTranslating(true);
                  try {
                    await onBulkAutoTranslate();
                    setResetNotification(
                      lang === 'el'
                        ? '✓ Όλες οι δραστηριότητες και τα κείμενα μεταφράστηκαν επιτυχώς στα Αγγλικά!'
                        : '✓ All activities and texts successfully translated to English!'
                    );
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsBulkTranslating(false);
                    setTimeout(() => setResetNotification(null), 5000);
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:to-indigo-400 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/25 cursor-pointer active:scale-95"
                title={lang === 'el' ? 'Αυτόματη μετάφραση όλων των δραστηριοτήτων στα Αγγλικά' : 'Translate all activities to English'}
              >
                {isBulkTranslating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>
                  {isBulkTranslating
                    ? lang === 'el'
                      ? 'Μετάφραση όλων σε εξέλιξη...'
                      : 'Translating all...'
                    : lang === 'el'
                    ? '⚡ Μετάφραση Όλων στα Αγγλικά'
                    : '⚡ Translate All to English'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Team Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
          {gameState.teams.map((tm) => {
            const isSelected = selectedTeamTab === tm.id;
            const assignedCount = gameState.questions.filter(
              (q) => !q.assignedTeamIds || q.assignedTeamIds.length === 0 || q.assignedTeamIds.includes(tm.id)
            ).length;

            return (
              <button
                key={tm.id}
                type="button"
                onClick={() => setSelectedTeamTab(tm.id)}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-950/60 border-amber-500 text-amber-200 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                <span className="text-base">{tm.avatar}</span>
                <span className="truncate max-w-[130px] sm:max-w-[160px]">{tm.name}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {assignedCount}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setSelectedTeamTab('all')}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              selectedTeamTab === 'all'
                ? 'bg-amber-950/60 border-amber-500 text-amber-200 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{lang === 'el' ? 'Όλες οι Ερωτήσεις (Σύνολο)' : 'All Quests (Overview)'}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              selectedTeamTab === 'all' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {gameState.questions.length}
            </span>
          </button>
        </div>

        {/* VIEW A: SPECIFIC TEAM SELECTED */}
        {activeTeam && selectedTeamTab !== 'all' ? (
          <div className="space-y-4">
            {/* Team Control Bar */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-3xl p-2.5 rounded-2xl bg-slate-950 border border-slate-800 shrink-0">
                  {activeTeam.avatar}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-100 truncate">
                      {activeTeam.name}
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono font-bold border border-slate-700">
                      {teamQuestions.length} {lang === 'el' ? 'δραστηριότητες' : 'activities'}
                    </span>
                  </div>
                  {activeTeam.slogan && (
                    <p className="text-xs text-slate-400 italic truncate mt-0.5">
                      «{activeTeam.slogan}»
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Progression mode toggle & Actions for this team */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Sequential Progression Mode Toggle */}
                <button
                  type="button"
                  onClick={() => onSetTeamSequentialMode(activeTeam.id, !isSequential)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isSequential
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title={isSequential ? t.sequentialProgressionDesc : t.freeProgressionDesc}
                >
                  {isSequential ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{lang === 'el' ? 'Βήμα-προς-Βήμα' : 'Step-by-Step'}</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{lang === 'el' ? 'Ελεύθερη Επιλογή' : 'Free Choice'}</span>
                    </>
                  )}
                </button>

                {/* Shuffle button for this team */}
                <button
                  type="button"
                  onClick={() => handleShuffleTeam(activeTeam.id)}
                  disabled={teamQuestions.length < 2}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  title={t.shuffleOrder}
                >
                  <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">{lang === 'el' ? 'Ανακάτεμα' : 'Shuffle'}</span>
                </button>

                {/* Reset to default order for this team */}
                <button
                  type="button"
                  onClick={() => handleResetTeamOrder(activeTeam.id)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  title={t.resetDefaultOrder}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">{lang === 'el' ? 'Επαναφορά' : 'Reset'}</span>
                </button>

                {/* Copy order to all teams */}
                <button
                  type="button"
                  onClick={() => {
                    onApplyOrderToAllTeams(teamQuestions.map(q => q.id));
                    setResetNotification(t.orderCopiedToAll);
                    setTimeout(() => setResetNotification(null), 3500);
                  }}
                  disabled={teamQuestions.length === 0}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  title={t.applyOrderToAll}
                >
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">{lang === 'el' ? 'Αντιγραφή σε όλες' : 'Copy to all'}</span>
                </button>

                {/* Add Activity Button specifically for this team */}
                <button
                  type="button"
                  onClick={() => setEditingQuestion('new')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-amber-500/20 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  <span>{lang === 'el' ? `+ Νέα για ${activeTeam.name.split(':')[0]}` : `+ New for ${activeTeam.name.split(':')[0]}`}</span>
                </button>
              </div>
            </div>

            {/* Activities List for this team in their defined order */}
            {teamQuestions.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
                <span className="text-4xl block">🎯</span>
                <h4 className="text-sm font-bold text-slate-200">
                  {lang === 'el' ? `Δεν υπάρχουν ακόμη δραστηριότητες για την ομάδα «${activeTeam.name}».` : `No activities yet for team «${activeTeam.name}».`}
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {lang === 'el'
                    ? 'Πατήστε το παραπάνω κουμπί για να προσθέσετε δραστηριότητα, ή μεταβείτε στην καρτέλα «Όλες οι Ερωτήσεις» για να αναθέσετε υπάρχουσες.'
                    : 'Click the button above to add an activity, or visit the "All Questions" tab to assign existing ones.'}
                </p>
                <button
                  type="button"
                  onClick={() => setEditingQuestion('new')}
                  className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'el' ? `Προσθήκη 1ης Δραστηριότητας για ${activeTeam.name}` : `Add 1st Quest for ${activeTeam.name}`}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {teamQuestions.map((quest, index) => {
                  const isActive = quest.isActive !== false;
                  const assignedTeams = quest.assignedTeamIds && quest.assignedTeamIds.length > 0
                    ? gameState.teams.filter(t => quest.assignedTeamIds?.includes(t.id))
                    : gameState.teams;
                  const isShared = !quest.assignedTeamIds || quest.assignedTeamIds.length === 0 || quest.assignedTeamIds.length > 1;

                  return (
                    <div
                      key={quest.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
                        isActive
                          ? 'bg-slate-900 border-slate-800 shadow-sm hover:border-slate-700'
                          : 'bg-slate-950/70 border-slate-800/70 opacity-65'
                      }`}
                    >
                      {/* Left: Reordering buttons (Up / Down) & Step number */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="flex flex-col items-center justify-center p-1 rounded-xl bg-slate-950 border border-slate-800 gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveTeamQuestion(activeTeam.id, index, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded-lg hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer transition-colors"
                            title={lang === 'el' ? 'Μετακίνηση Πάνω (Αλλαγή Θέσης)' : 'Move Up'}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <span className="font-mono text-xs font-black text-amber-400 px-1.5 py-0.5 rounded bg-slate-900">
                            #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleMoveTeamQuestion(activeTeam.id, index, 'down')}
                            disabled={index === teamQuestions.length - 1}
                            className="p-1 rounded-lg hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer transition-colors"
                            title={lang === 'el' ? 'Μετακίνηση Κάτω (Αλλαγή Θέσης)' : 'Move Down'}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quest Image Thumbnail if exists */}
                        {quest.imageUrl && (
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 flex items-center justify-center">
                            <img
                              src={quest.imageUrl}
                              alt="Quest thumb"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                      </div>

                      {/* Middle: Quest Title, Type, Description & Scope badge */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="font-semibold text-cyan-400 text-[11px] px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                            {t[quest.type]}
                          </span>
                          <span className="font-mono text-amber-400 font-bold text-[11px]">
                            {quest.points} {t.pts}
                          </span>

                          {/* Exclusive vs Shared Badge */}
                          {isShared ? (
                            <span
                              className="text-[11px] text-slate-300 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60"
                              title={assignedTeams.map(t => t.name).join(', ')}
                            >
                              <span>🌐</span>
                              <span>{lang === 'el' ? `Κοινή με ${assignedTeams.length - 1} άλλες ομάδες` : `Shared with ${assignedTeams.length - 1} other teams`}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-300 flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-800/40 font-semibold">
                              <span>🔒</span>
                              <span>{lang === 'el' ? `Μόνο για ${activeTeam.name.split(':')[0]}` : `Exclusive to ${activeTeam.name.split(':')[0]}`}</span>
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          {/* Greek original title */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              🇬🇷 EL
                            </span>
                            <h4 className="text-sm font-bold text-slate-100 leading-snug">
                              {quest.title}
                            </h4>
                          </div>

                          {/* English translation preview */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30">
                              🇬🇧 EN
                            </span>
                            <span className="text-xs font-semibold text-sky-200 leading-snug">
                              {quest.title_en || translateGreekToEnglish(quest.title)}
                            </span>
                            {quest.title_en ? (
                              <span className="text-[9px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/40 px-1 rounded" title="Χειροκίνητα επεξεργασμένο στα Αγγλικά">
                                ✓ Edited
                              </span>
                            ) : (
                              <span className="text-[9px] text-sky-400 font-mono bg-sky-950/60 border border-sky-800/40 px-1 rounded" title="Αυτόματη μετάφραση">
                                ⚡ Auto-EN
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-400 line-clamp-1 pt-0.5">
                            {quest.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: Active Toggle, Full Edit & Remove from Team */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                        {/* Active toggle */}
                        <button
                          type="button"
                          onClick={() => onToggleQuestionActive(quest.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300'
                              : 'bg-slate-800 border border-slate-700 text-slate-400'
                          }`}
                          title={lang === 'el' ? 'Κλικ για ενεργοποίηση/απενεργοποίηση' : 'Toggle active'}
                        >
                          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          <span>{isActive ? (lang === 'el' ? 'ΕΝΕΡΓΗ' : 'ACTIVE') : (lang === 'el' ? 'ΑΝΕΝΕΡΓΗ' : 'OFF')}</span>
                        </button>

                        {/* Edit Button (Bilingual) */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuestion(quest);
                            setEditorInitialTab('both');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                          title={lang === 'el' ? 'Επεξεργασία (Δίγλωσση Προβολή)' : 'Edit Quest (Bilingual)'}
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-950" />
                          <span>{lang === 'el' ? 'Επεξεργασία' : 'Edit'}</span>
                        </button>

                        {/* Direct Final Editing Button for English */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuestion(quest);
                            setEditorInitialTab('en');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-500/50 text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                          title={lang === 'el' ? 'Απευθείας τελικό editing της Αγγλικής έκδοσης' : 'Direct final editing of English translation'}
                        >
                          <span>🇬🇧</span>
                          <span className="hidden sm:inline">{lang === 'el' ? 'Τελικό Editing' : 'Edit EN'}</span>
                        </button>

                        {/* Remove from this team */}
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestionFromTeam(quest, activeTeam.id)}
                          className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors cursor-pointer"
                          title={lang === 'el' ? `Αφαίρεση από την ομάδα «${activeTeam.name}»` : `Remove from ${activeTeam.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* VIEW B: ALL QUESTIONS OVERVIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {gameState.questions.map((quest, index) => {
              const isActive = quest.isActive !== false;
              const assignedTeams = quest.assignedTeamIds && quest.assignedTeamIds.length > 0
                ? gameState.teams.filter(t => quest.assignedTeamIds?.includes(t.id))
                : gameState.teams;
              const isAll = !quest.assignedTeamIds || quest.assignedTeamIds.length === 0 || quest.assignedTeamIds.length === gameState.teams.length;

              return (
                <div
                  key={quest.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isActive
                      ? 'bg-slate-900 border-slate-800 shadow-sm hover:border-slate-700'
                      : 'bg-slate-950/60 border-slate-800/60 opacity-65'
                  }`}
                >
                  <div>
                    {/* Top line: Index, Type, Points, and Active Switch */}
                    <div className="flex items-center justify-between gap-2 text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-800 text-amber-400 font-mono text-[11px] flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-cyan-400 text-[11px]">{t[quest.type]}</span>
                        <span className="text-slate-600">·</span>
                        <span className="font-mono text-amber-400 font-bold text-[11px]">{quest.points} {t.pts}</span>
                      </div>

                      {/* Enable/Disable Quick Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => onToggleQuestionActive(quest.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                          isActive
                            ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300'
                            : 'bg-slate-800 border border-slate-700 text-slate-400'
                        }`}
                        title={lang === 'el' ? 'Κλικ για ενεργοποίηση/απενεργοποίηση' : 'Toggle active'}
                      >
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        <span>{isActive ? (lang === 'el' ? 'ΕΝΕΡΓΗ' : 'ACTIVE') : (lang === 'el' ? 'ΑΝΕΝΕΡΓΗ' : 'DISABLED')}</span>
                      </button>
                    </div>

                    {/* Title & Preview Image */}
                    <div className="flex items-start gap-3">
                      {quest.imageUrl && (
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 flex items-center justify-center">
                          <img
                            src={quest.imageUrl}
                            alt="Quest thumb"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-100 leading-snug line-clamp-2">
                            {lang === 'en'
                              ? quest.title_en || translateGreekToEnglish(quest.title)
                              : quest.title}
                          </h4>
                          {quest.title_en ? (
                            <span className="text-[9px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/40 px-1 py-0.2 rounded">
                              🇬🇧 EN
                            </span>
                          ) : (
                            <span className="text-[9px] text-sky-400 font-mono bg-sky-950/60 border border-sky-800/40 px-1 py-0.2 rounded" title="Auto-translated from Greek">
                              ⚡ Auto
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {lang === 'en'
                            ? quest.description_en || translateGreekToEnglish(quest.description)
                            : quest.description}
                        </p>
                      </div>
                    </div>

                    {/* Assigned Teams Badge Bar */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">
                        {lang === 'el' ? 'Ομάδες:' : 'Teams:'}
                      </span>
                      {isAll ? (
                        <span className="text-[11px] text-slate-300 font-medium px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700">
                          {lang === 'el' ? 'Όλες οι Ομάδες' : 'All Teams'}
                        </span>
                      ) : (
                        assignedTeams.map((tm) => (
                          <span
                            key={tm.id}
                            className="text-[11px] text-slate-200 font-medium px-1.5 py-0.5 rounded-md bg-slate-800/90 border border-slate-700 flex items-center gap-1"
                          >
                            <span>{tm.avatar}</span>
                            <span>{tm.name.split(':')[0]}</span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Card Actions: Edit & Delete */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuestion(quest);
                        setEditorInitialTab('both');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-950" />
                      <span>{lang === 'el' ? '✏️ Επεξεργασία' : '✏️ Edit'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuestion(quest);
                        setEditorInitialTab('en');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-500/50 text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                      title={lang === 'el' ? 'Απευθείας τελικό editing της Αγγλικής έκδοσης' : 'Direct final editing of English translation'}
                    >
                      <span>🇬🇧</span>
                      <span className="hidden sm:inline">{lang === 'el' ? 'Τελικό Editing' : 'Edit EN'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteQuestion(quest.id)}
                      className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors cursor-pointer"
                      title={t.deleteQuestion}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Advanced Batch Station Rotation Tool */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <span>🔁 {t.stationRotation}</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {t.stationRotationDesc}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onApplyStationRotation();
            setResetNotification(
              lang === 'el' ? 'Η κυκλική εναλλαγή σταθμών εφαρμόστηκε στις ομάδες!' : 'Staggered rotation applied!'
            );
            setTimeout(() => setResetNotification(null), 3500);
          }}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{lang === 'el' ? 'Εφαρμογή Εναλλαγής Σταθμών' : 'Apply Rotation'}</span>
        </button>
      </div>

      {/* Teams Manager */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>{t.manageTeams}</span>
              <span className="text-xs text-slate-500 font-normal">({gameState.teams.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'el'
                ? 'Κάντε κλικ στο «Αλλαγή» σε οποιαδήποτε ομάδα για να αλλάξετε το όνομα, το σύνθημα, το avatar ή το χρώμα της.'
                : 'Click "Edit" on any team to change its name, slogan, avatar emoji, or theme color.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditingTeam('new')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>{t.addTeam}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {gameState.teams.map((tm) => (
            <div
              key={tm.id}
              className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 shadow-sm hover:border-slate-700 transition-colors"
              style={{ borderLeft: `4px solid ${tm.color}` }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl p-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shrink-0">
                  {tm.avatar}
                </span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-100 truncate" title={tm.name}>
                    {tm.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span className="truncate">{tm.slogan || (lang === 'el' ? 'Χωρίς σύνθημα' : 'No slogan')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingTeam(tm)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 text-[11px] font-bold border border-slate-700 hover:border-amber-400 transition-all flex items-center gap-1 cursor-pointer"
                  title={lang === 'el' ? `Αλλαγή ονόματος & στοιχείων για: ${tm.name}` : `Edit details for: ${tm.name}`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{lang === 'el' ? 'Αλλαγή' : 'Edit'}</span>
                </button>

                {gameState.teams.length > 2 && (
                  <button
                    type="button"
                    onClick={() => onDeleteTeam(tm.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                    title={t.delete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add or Edit Question */}
      {editingQuestion && (
        <QuestionEditorModal
          question={editingQuestion === 'new' ? null : editingQuestion}
          teams={gameState.teams}
          lang={lang}
          initialTeamId={selectedTeamTab !== 'all' ? selectedTeamTab : undefined}
          initialTab={(editingQuestion as any)?._openTab || editorInitialTab}
          onSave={(savedQuestion) => {
            if (editingQuestion === 'new') {
              onAddQuestion(savedQuestion);
              // If added while on a specific team tab, append to this team's sequence
              if (selectedTeamTab !== 'all') {
                const existingOrdered = getTeamOrderedQuestions(
                  activeTeam || ({ id: selectedTeamTab } as any),
                  gameState.questions,
                  gameState.teamQuestionOrders,
                  true
                ).map((q) => q.id);
                if (!existingOrdered.includes(savedQuestion.id)) {
                  onSetTeamQuestionOrder(selectedTeamTab, [...existingOrdered, savedQuestion.id]);
                }
              }
            } else {
              onUpdateQuestion(savedQuestion);
            }
            setEditingQuestion(null);
          }}
          onClose={() => setEditingQuestion(null)}
        />
      )}

      {/* Modal: Add or Edit Team */}
      {editingTeam && (
        <TeamEditorModal
          team={editingTeam === 'new' ? null : editingTeam}
          isOpen={!!editingTeam}
          lang={lang}
          onClose={() => setEditingTeam(null)}
          onSave={(savedTeam) => {
            if (editingTeam === 'new') {
              onAddTeam(savedTeam);
            } else {
              onUpdateTeam(savedTeam);
            }
            setEditingTeam(null);
          }}
        />
      )}

      {/* Modal: QR Printable Station Badges */}
      {showQrPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn print:p-0 print:bg-white">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5 print:border-none print:bg-white print:text-black">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
              <div>
                <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-purple-400" />
                  <span>{t.printQrStationCards}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{t.qrStationCardsHelp}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Εκτύπωση</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQrPrintModal(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {qrQuestions.map((q) => {
                const targetCode = (q.payload as any).targetCode || 'BOUND-QUEST';
                return (
                  <div
                    key={q.id}
                    className="p-5 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950 flex flex-col items-center text-center space-y-3 print:border-black print:bg-white print:text-black"
                  >
                    <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider print:border print:border-black print:text-black">
                      Σταθμός Αποστολής / Station
                    </div>
                    <h4 className="font-bold text-sm text-slate-200 print:text-black">{q.title}</h4>

                    {/* Genuine scannable QR Code */}
                    <div className="p-2 bg-white rounded-xl shadow-md border border-slate-200 flex items-center justify-center">
                      <ScannableQrImage value={targetCode} size={150} />
                    </div>

                    <div className="font-mono text-xs font-black tracking-widest text-amber-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 print:bg-slate-100 print:text-black">
                      CODE: {targetCode}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Browser Snapshot History Recovery Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-slate-100">
                  {lang === 'el' ? 'Ανάκτηση από Ιστορικό Στιγμιοτύπων' : 'Restore from Snapshot History'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between mt-3 mb-3 gap-2">
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === 'el'
                  ? 'Αυτόματα και χειροκίνητα σημεία επαναφοράς στον περιηγητή σας:'
                  : 'Automated and manual restore checkpoints stored in your browser:'}
              </p>
              <button
                type="button"
                onClick={() => {
                  syncService.createManualCheckpoint(gameState);
                  setResetNotification(
                    lang === 'el'
                      ? '✓ Νέο σημείο επαναφοράς δημιουργήθηκε με επιτυχία!'
                      : '✓ New checkpoint created successfully!'
                  );
                  setTimeout(() => setResetNotification(null), 3000);
                }}
                className="shrink-0 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <span>📸 {lang === 'el' ? 'Νέο Checkpoint' : 'New Checkpoint'}</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {syncService.getSnapshots().length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  {lang === 'el' ? 'Δεν υπάρχουν ακόμη καταγεγραμμένα στιγμιότυπα.' : 'No snapshots recorded yet.'}
                </div>
              ) : (
                syncService
                  .getSnapshots()
                  .slice()
                  .reverse()
                  .map((snap) => (
                    <div
                      key={snap.timestamp}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-purple-500/50 transition-colors"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                          <span>{new Date(snap.timestamp).toLocaleString(lang === 'el' ? 'el-GR' : 'en-US')}</span>
                          {snap.label && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-950 border border-purple-500/40 text-purple-300 font-mono">
                              {snap.label}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {snap.state.questions?.length || 0} {lang === 'el' ? 'ερωτήσεις' : 'questions'} • {snap.state.teams?.length || 0} {lang === 'el' ? 'ομάδες' : 'teams'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onRestoreBackup) {
                            onRestoreBackup(snap.state);
                            setShowHistoryModal(false);
                            setResetNotification(
                              lang === 'el'
                                ? '✓ Επιτυχής επαναφορά του στιγμιοτύπου!'
                                : '✓ Snapshot restored successfully!'
                            );
                            setTimeout(() => setResetNotification(null), 4000);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer transition-colors"
                      >
                        {lang === 'el' ? 'Επαναφορά' : 'Restore'}
                      </button>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {lang === 'el'
                  ? `Σύνολο: ${syncService.getSnapshots().length} διαθέσιμα σημεία επαναφοράς`
                  : `Total: ${syncService.getSnapshots().length} checkpoints available`}
              </span>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                {lang === 'el' ? 'Κλείσιμο' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
