import React, { useState } from 'react';
import {
  MessageSquare, Maximize, Minimize, Sparkles, Heart, Camera, HelpCircle,
  Puzzle, QrCode, SplitSquareVertical, CheckCircle2, Award, X, User, Target
} from 'lucide-react';
import { GameState, Language, Team, TeamSynthesisNote, Question, Submission } from '../types/game';
import { translations } from '../locales/translations';

interface Props {
  gameState: GameState;
  lang: Language;
  onLikeNote?: (noteId: string) => void;
  onAddTeacherFeedback?: (noteId: string, feedback: string) => void;
}

export const DiscussionShowcaseView: React.FC<Props> = ({
  gameState,
  lang,
  onLikeNote,
  onAddTeacherFeedback
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'notes' | 'quests'>('notes');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [spotlightNote, setSpotlightNote] = useState<{ note: TeamSynthesisNote; team: Team } | null>(null);
  const [spotlightQuest, setSpotlightQuest] = useState<{ question: Question; team: Team; submission: Submission } | null>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 p-4 sm:p-6 flex flex-col space-y-5">
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
              <span>{t.discussionPadletTitle}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.discussionPadletSubtitle}
            </p>
          </div>
        </div>

        {/* View mode toggle & Fullscreen */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'notes'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.viewAllNotesTab} ({gameState.synthesisNotes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quests')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'quests'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.viewAllQuestsTab} ({Object.keys(gameState.submissions).length})
            </button>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title={isFullscreen ? t.exitFullscreen : t.toggleFullscreen}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Synthesis Prompt Display */}
      {gameState.synthesisPrompt && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span><strong className="text-amber-300">{lang === 'el' ? 'Κεντρικό Ερώτημα Συζήτησης' : 'Key Discussion Topic'}:</strong> {gameState.synthesisPrompt}</span>
        </div>
      )}

      {/* Columns for All Teams Side-by-Side (True Padlet Grid) */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 items-start no-scrollbar">
        {gameState.teams.map((team) => {
          const teamNotes = gameState.synthesisNotes.filter(n => n.teamId === team.id);
          const visibleQuests = gameState.questions.filter(q => {
            if (q.isActive === false) return false;
            if (!q.assignedTeamIds || q.assignedTeamIds.length === 0) return true;
            return q.assignedTeamIds.includes(team.id);
          });
          const teamSubmissions = visibleQuests
            .map(q => gameState.submissions[`${team.id}_${q.id}`])
            .filter(Boolean);
          const score = teamSubmissions.reduce((sum, s) => sum + (s?.scoreEarned || 0), 0);

          return (
            <div
              key={team.id}
              className="flex flex-col w-84 sm:w-92 shrink-0 bg-slate-900/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl max-h-[calc(100vh-13rem)]"
            >
              {/* Column Header */}
              <div
                className="p-4 border-b border-slate-800 bg-slate-950/70"
                style={{ borderTop: `4px solid ${team.color}` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl p-1 bg-slate-900 rounded-xl border border-slate-800 shrink-0">
                      {team.avatar}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-100 truncate">{team.name}</h3>
                      {team.slogan && (
                        <p className="text-[11px] text-slate-400 truncate italic">{team.slogan}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-amber-400">{score} {t.pts}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      {teamNotes.length} {lang === 'el' ? 'σημειώσεις' : 'notes'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Padlet Scrollable Cards List */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1 no-scrollbar">
                {activeTab === 'notes' ? (
                  /* TAB 1: SYNTHESIS NOTES */
                  teamNotes.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 italic">
                      {lang === 'el' ? 'Η ομάδα δεν έχει αναρτήσει συμπεράσματα ακόμα' : 'No synthesis notes posted yet'}
                    </div>
                  ) : (
                    teamNotes.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => setSpotlightNote({ note, team })}
                        className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-amber-500/80 hover:bg-slate-950 transition-all cursor-pointer shadow-sm group"
                      >
                        <h4 className="text-xs font-bold text-slate-100 mb-1.5 group-hover:text-amber-300 transition-colors">
                          {note.title}
                        </h4>

                        {note.imageUrl && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-slate-800 max-h-32 bg-slate-900 flex items-center justify-center">
                            <img
                              src={note.imageUrl}
                              alt={note.title}
                              className="w-full h-28 object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-2">
                          {note.content}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-800/60">
                          <span className="truncate">{note.author || team.name}</span>
                          <span className="text-amber-400 font-semibold group-hover:underline">
                            {lang === 'el' ? 'Προβολή' : 'Expand'} ↗
                          </span>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  /* TAB 2: QUEST RESULTS & PROOFS */
                  visibleQuests.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 italic">
                      {lang === 'el' ? 'Δεν υπάρχουν αποστολές' : 'No quests assigned'}
                    </div>
                  ) : (
                    visibleQuests.map((quest) => {
                      const sub = gameState.submissions[`${team.id}_${quest.id}`];
                      const isDone = !!sub;
                      const isCorrect = sub?.status === 'correct' || sub?.status === 'completed';

                      return (
                        <div
                          key={quest.id}
                          onClick={() => sub && setSpotlightQuest({ question: quest, team, submission: sub })}
                          className={`p-3 rounded-xl border transition-all ${
                            isDone
                              ? isCorrect
                                ? 'bg-slate-950/80 border-emerald-900/60 hover:border-emerald-700/80 cursor-pointer'
                                : 'bg-slate-950/80 border-rose-900/60 hover:border-rose-700/80 cursor-pointer'
                              : 'bg-slate-950/40 border-slate-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] mb-1 text-slate-400">
                            <div className="flex items-center gap-1 font-medium">
                              {getQuestIcon(quest.type)}
                              <span>{t[quest.type]}</span>
                            </div>
                            <span className="font-mono font-bold text-amber-400">
                              {isDone ? `+${sub.scoreEarned}` : quest.points} {t.pts}
                            </span>
                          </div>

                          <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 mb-1.5">
                            {quest.title}
                          </h4>

                          {sub?.photoUrl && (
                            <div className="mb-1.5 rounded-lg overflow-hidden border border-slate-800 h-24 bg-slate-900">
                              <img
                                src={sub.photoUrl}
                                alt="Proof"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[10px]">
                            {isDone ? (
                              <span className={`font-semibold flex items-center gap-1 ${
                                isCorrect ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                <CheckCircle2 className="w-3 h-3" />
                                {isCorrect ? t.statusCompleted : t.statusIncorrect}
                              </span>
                            ) : (
                              <span className="text-slate-500">{t.statusPending}</span>
                            )}
                            {isDone && <span className="text-slate-400">Κλικ για προβολή</span>}
                          </div>
                        </div>
                      );
                    })
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Spotlight Modal for Expanded Note */}
      {spotlightNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: spotlightNote.team.color }} />
                  <span className="font-bold text-slate-200">{spotlightNote.team.name}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">{spotlightNote.note.author || spotlightNote.team.name}</span>
                </div>
                <h2 className="text-lg font-black text-slate-100">{spotlightNote.note.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSpotlightNote(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {spotlightNote.note.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-800 max-h-72 bg-slate-950 flex items-center justify-center">
                <img
                  src={spotlightNote.note.imageUrl}
                  alt={spotlightNote.note.title}
                  className="w-full h-auto max-h-72 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              {spotlightNote.note.content}
            </p>

            {spotlightNote.note.feedbackComment && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span><strong>{t.teacherFeedback}:</strong> {spotlightNote.note.feedbackComment}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spotlight Modal for Quest Submission */}
      {spotlightQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-semibold text-amber-400 block">{spotlightQuest.team.name}</span>
                <h2 className="text-base font-bold text-slate-100">{spotlightQuest.question.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSpotlightQuest(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {spotlightQuest.submission.photoUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-800 max-h-72 bg-slate-950 flex items-center justify-center">
                <img
                  src={spotlightQuest.submission.photoUrl}
                  alt="Proof"
                  className="w-full h-auto max-h-72 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="font-semibold text-emerald-400 block">
                {t.statusCompleted} (+{spotlightQuest.submission.scoreEarned} {t.pts})
              </span>
              {spotlightQuest.submission.answerData?.caption && (
                <p className="text-slate-300 italic">"{spotlightQuest.submission.answerData.caption}"</p>
              )}
              {spotlightQuest.submission.puzzleStats && (
                <p className="text-slate-400">
                  {t.movesCount}: {spotlightQuest.submission.puzzleStats.moves} · {t.timeElapsed}: {spotlightQuest.submission.puzzleStats.durationSeconds}s
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
