import React, { useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Shuffle,
  RotateCcw,
  Copy,
  Lock,
  Unlock,
  Layers,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  SplitSquareVertical,
  QrCode,
  Camera,
  Puzzle,
  Award,
  Repeat,
  Target
} from 'lucide-react';
import { GameState, Language, Question, Team } from '../types/game';
import { translations } from '../locales/translations';
import { getTeamOrderedQuestions, isTeamSequentialProgression } from '../utils/questOrder';

interface Props {
  gameState: GameState;
  lang: Language;
  onSetTeamQuestionOrder: (teamId: string, questionIds: string[]) => void;
  onSetTeamSequentialMode: (teamId: string, isSequential: boolean) => void;
  onApplyOrderToAllTeams: (questionIds: string[]) => void;
  onApplyStationRotation: () => void;
}

export const TeamQuestSequenceManager: React.FC<Props> = ({
  gameState,
  lang,
  onSetTeamQuestionOrder,
  onSetTeamSequentialMode,
  onApplyOrderToAllTeams,
  onApplyStationRotation
}) => {
  const t = translations[lang];
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    gameState.teams[0]?.id || ''
  );
  const [notification, setNotification] = useState<string | null>(null);

  const selectedTeam =
    gameState.teams.find((t) => t.id === selectedTeamId) || gameState.teams[0];

  if (!selectedTeam) return null;

  // Retrieve current ordered questions for the selected team
  const orderedQuestions = getTeamOrderedQuestions(
    selectedTeam,
    gameState.questions,
    gameState.teamQuestionOrders
  );

  const isSequential = isTeamSequentialProgression(
    selectedTeam,
    gameState.teamSequentialModes
  );

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const getQuestIcon = (type: Question['type']) => {
    switch (type) {
      case 'multiple_choice':
      case 'true_false':
        return <HelpCircle className="w-3.5 h-3.5 text-amber-400" />;
      case 'text_match':
      case 'image_match':
        return <SplitSquareVertical className="w-3.5 h-3.5 text-cyan-400" />;
      case 'qr_scan':
        return <QrCode className="w-3.5 h-3.5 text-purple-400" />;
      case 'photo_upload':
        return <Camera className="w-3.5 h-3.5 text-emerald-400" />;
      case 'puzzle':
        return <Puzzle className="w-3.5 h-3.5 text-rose-400" />;
      case 'task':
        return <Target className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Award className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Reorder operations
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedQuestions.length) return;

    const newOrder = [...orderedQuestions.map((q) => q.id)];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    onSetTeamQuestionOrder(selectedTeam.id, newOrder);
  };

  const handleSetPosition = (fromIndex: number, toIndex: number) => {
    if (toIndex === fromIndex) return;
    const ids = orderedQuestions.map((q) => q.id);
    const [movedId] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, movedId);
    onSetTeamQuestionOrder(selectedTeam.id, ids);
  };

  const handleShuffle = () => {
    const ids = [...orderedQuestions.map((q) => q.id)];
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    onSetTeamQuestionOrder(selectedTeam.id, ids);
    showToast(
      lang === 'el'
        ? `Η σειρά για την ομάδα «${selectedTeam.name}» ανακατεύτηκε!`
        : `Order shuffled for team «${selectedTeam.name}»!`
    );
  };

  const handleResetDefault = () => {
    // Filter active and assigned questions in their original declaration order
    const defaultIds = gameState.questions
      .filter((q) => {
        if (q.isActive === false) return false;
        if (!q.assignedTeamIds || q.assignedTeamIds.length === 0) return true;
        return q.assignedTeamIds.includes(selectedTeam.id);
      })
      .map((q) => q.id);

    onSetTeamQuestionOrder(selectedTeam.id, defaultIds);
    showToast(
      lang === 'el'
        ? 'Επαναφορά στην αρχική σειρά ερωτήσεων'
        : 'Reset to initial question order'
    );
  };

  const handleApplyToAll = () => {
    const ids = orderedQuestions.map((q) => q.id);
    onApplyOrderToAllTeams(ids);
    showToast(t.orderCopiedToAll);
  };

  const handleStationRotationClick = () => {
    onApplyStationRotation();
    showToast(
      lang === 'el'
        ? 'Εφαρμόστηκε κυκλική εναλλαγή σταθμών σε όλες τις ομάδες!'
        : 'Staggered station rotation applied across all teams!'
    );
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>{t.teamQuestOrderTitle}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {t.teamQuestOrderSubtitle}
          </p>
        </div>

        {notification && (
          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-md animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      {/* Team Selection Tabs */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          {t.selectTeamToConfigure}
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {gameState.teams.map((tm) => {
            const isSelected = tm.id === selectedTeam.id;
            const count = getTeamOrderedQuestions(
              tm,
              gameState.questions,
              gameState.teamQuestionOrders
            ).length;
            const isTmSeq = isTeamSequentialProgression(
              tm,
              gameState.teamSequentialModes
            );

            return (
              <button
                key={tm.id}
                type="button"
                onClick={() => setSelectedTeamId(tm.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <span className="text-base">{tm.avatar}</span>
                <span className="truncate max-w-[130px]">{tm.name.split(':')[0]}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                    isSelected
                      ? 'bg-slate-950 text-amber-400 font-extrabold'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
                {isTmSeq && (
                  <Lock
                    className={`w-3 h-3 ${
                      isSelected ? 'text-slate-950' : 'text-amber-400'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progression Mode Switch: Sequential vs Free */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          {lang === 'el' ? 'Τρόπος Απάντησης / Εκτέλεσης:' : 'Progression / Answer Mode:'}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option 1: Sequential Actionbound style */}
          <button
            type="button"
            onClick={() => onSetTeamSequentialMode(selectedTeam.id, true)}
            className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
              isSequential
                ? 'bg-amber-500/10 border-amber-500/70 shadow-sm ring-1 ring-amber-500/30'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-70'
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                isSequential
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-100">
                  {t.sequentialProgression}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Actionbound
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {t.sequentialProgressionDesc}
              </p>
            </div>
          </button>

          {/* Option 2: Free Choice */}
          <button
            type="button"
            onClick={() => onSetTeamSequentialMode(selectedTeam.id, false)}
            className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
              !isSequential
                ? 'bg-cyan-500/10 border-cyan-500/70 shadow-sm ring-1 ring-cyan-500/30'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-70'
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                !isSequential
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Unlock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 block">
                {t.freeProgression}
              </span>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {t.freeProgressionDesc}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Action Toolbar for Order */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <span className="text-xs font-bold text-slate-300">
          {lang === 'el'
            ? `Σειρά Αποστολών για ${selectedTeam.name} (${orderedQuestions.length})`
            : `Quest Sequence for ${selectedTeam.name} (${orderedQuestions.length})`}
        </span>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleShuffle}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title={t.shuffleOrder}
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.shuffleOrder}</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefault}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title={t.resetDefaultOrder}
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>{t.resetDefaultOrder}</span>
          </button>

          <button
            type="button"
            onClick={handleApplyToAll}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title={t.applyOrderToAll}
          >
            <Copy className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.applyOrderToAll}</span>
          </button>

          <button
            type="button"
            onClick={handleStationRotationClick}
            className="px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900/80 text-purple-200 text-xs font-bold border border-purple-500/50 flex items-center gap-1.5 transition-colors cursor-pointer"
            title={t.stationRotationDesc}
          >
            <Repeat className="w-3.5 h-3.5 text-purple-400" />
            <span>{t.stationRotation}</span>
          </button>
        </div>
      </div>

      {/* Ordered Questions List */}
      {orderedQuestions.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
          {lang === 'el'
            ? 'Δεν υπάρχουν ενεργές δραστηριότητες ανατεθειμένες σε αυτή την ομάδα.'
            : 'No active quest activities assigned to this team.'}
        </div>
      ) : (
        <div className="space-y-2.5">
          {orderedQuestions.map((quest, index) => {
            const isFirst = index === 0;
            const isLast = index === orderedQuestions.length - 1;

            return (
              <div
                key={quest.id}
                className="p-3 sm:p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                {/* Step number badge & Quest information */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {t.stepNumber}
                    </span>
                    <span className="text-base font-black font-mono text-amber-400">
                      {index + 1}
                    </span>
                  </div>

                  {quest.imageUrl && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0 flex items-center justify-center">
                      <img
                        src={quest.imageUrl}
                        alt="thumb"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] mb-0.5">
                      <div className="flex items-center gap-1 font-medium text-slate-400">
                        {getQuestIcon(quest.type)}
                        <span>{t[quest.type]}</span>
                      </div>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono text-amber-400 font-bold">
                        {quest.points} {t.pts}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-100 truncate">
                      {quest.title}
                    </h4>

                    <p className="text-[11px] text-slate-400 truncate max-w-md">
                      {quest.description}
                    </p>
                  </div>
                </div>

                {/* Direct Position Selector & Up / Down Buttons */}
                <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  {/* Quick Position Select dropdown */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="text-[10px] uppercase font-semibold text-slate-500">
                      {t.stepNumber}:
                    </span>
                    <select
                      value={index}
                      onChange={(e) =>
                        handleSetPosition(index, parseInt(e.target.value, 10))
                      }
                      className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-amber-300 focus:outline-none"
                    >
                      {orderedQuestions.map((_, posIdx) => (
                        <option key={posIdx} value={posIdx}>
                          #{posIdx + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

                  {/* Move Up Button */}
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => handleMove(index, 'up')}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={t.moveUp}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  {/* Move Down Button */}
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => handleMove(index, 'down')}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={t.moveDown}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
