import React, { useState } from 'react';
import { Maximize, Minimize, Trophy, Clock, Camera, Sparkles, X } from 'lucide-react';
import { GameState, Language, Team, Question } from '../types/game';
import { translations } from '../locales/translations';
import { TeamColumn } from './TeamColumn';
import { QuestSolverModal } from './QuestSolverModal';

interface Props {
  gameState: GameState;
  lang: Language;
}

export const ProjectorView: React.FC<Props> = ({ gameState, lang }) => {
  const t = translations[lang];
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedQuestForInspect, setSelectedQuestForInspect] = useState<{
    question: Question;
    team: Team;
  } | null>(null);
  const [showPhotoGallery, setShowPhotoGallery] = useState<boolean>(false);

  // Toggle browser fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Rank teams by score considering active and assigned questions
  const rankedTeams = [...gameState.teams].map(team => {
    const visibleQuestions = gameState.questions.filter(q => {
      if (q.isActive === false) return false;
      if (!q.assignedTeamIds || q.assignedTeamIds.length === 0) return true;
      return q.assignedTeamIds.includes(team.id);
    });
    const submissions = visibleQuestions
      .map(q => gameState.submissions[`${team.id}_${q.id}`])
      .filter(Boolean);
    const score = submissions.reduce((sum, s) => sum + (s?.scoreEarned || 0), 0);
    const completed = submissions.length;
    const totalQuests = visibleQuestions.length;
    return { team, score, completed, totalQuests };
  }).sort((a, b) => b.score - a.score);

  // Collect all photos uploaded across teams
  const allUploadedPhotos = Object.values(gameState.submissions)
    .filter(s => s && s.photoUrl)
    .map(s => {
      const team = gameState.teams.find(t => t.id === s.teamId);
      const question = gameState.questions.find(q => q.id === s.questionId);
      return { submission: s, team, question };
    });

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 p-4 sm:p-6 flex flex-col space-y-5">
      {/* Top Projector Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
              <span>{t.projectorTitle}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </h1>
            <p className="text-xs text-slate-400">
              {t.projectorSubtitle}
            </p>
          </div>
        </div>

        {/* Live Big Timer Display */}
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl border flex items-center gap-2.5 font-mono ${
            gameState.timer.remainingSeconds <= 60 && gameState.timer.remainingSeconds > 0
              ? 'bg-rose-950/80 border-rose-600 text-rose-300 animate-pulse'
              : 'bg-slate-950 border-slate-700 text-amber-400'
          }`}>
            <Clock className="w-5 h-5 text-amber-400" />
            <span className="text-2xl font-black tabular-nums">
              {formatTimer(gameState.timer.remainingSeconds)}
            </span>
          </div>

          {allUploadedPhotos.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPhotoGallery(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>{t.viewAllPhotos} ({allUploadedPhotos.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title={isFullscreen ? t.exitFullscreen : t.toggleFullscreen}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Real-time Live Leaderboard Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {rankedTeams.map((entry, index) => {
          const rankMedals = ['🥇', '🥈', '🥉', '🎖️'];
          return (
            <div
              key={entry.team.id}
              className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden flex items-center justify-between shadow-lg"
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5"
                style={{ backgroundColor: entry.team.color }}
              />
              <div className="flex items-center gap-2.5 min-w-0 pl-1">
                <span className="text-xl shrink-0">{rankMedals[index] || '🎖️'}</span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-100 truncate">
                    {entry.team.name}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {entry.completed}/{entry.totalQuests} {t.completedQuests}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-base font-black font-mono text-amber-400">
                  {entry.score}
                </span>
                <span className="text-[10px] text-slate-400 block font-semibold">
                  {t.pts}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* All Team Columns Side-by-Side (Padlet board layout) */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {gameState.teams.map((team) => (
          <TeamColumn
            key={team.id}
            team={team}
            questions={gameState.questions}
            submissions={gameState.submissions}
            lang={lang}
            isInteractive={true}
            teamQuestionOrders={gameState.teamQuestionOrders}
            teamSequentialModes={gameState.teamSequentialModes}
            onOpenQuest={(quest) => {
              setSelectedQuestForInspect({ question: quest, team });
            }}
          />
        ))}
      </div>

      {/* Inspect Modal on Projector */}
      {selectedQuestForInspect && (
        <QuestSolverModal
          question={selectedQuestForInspect.question}
          team={selectedQuestForInspect.team}
          existingSubmission={
            gameState.submissions[`${selectedQuestForInspect.team.id}_${selectedQuestForInspect.question.id}`]
          }
          lang={lang}
          readOnly={true}
          onClose={() => setSelectedQuestForInspect(null)}
          onSubmit={() => {}}
        />
      )}

      {/* Photo Gallery Modal */}
      {showPhotoGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-slate-100">{t.viewAllPhotos}</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowPhotoGallery(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {allUploadedPhotos.map((item, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col">
                  <div className="h-48 overflow-hidden bg-black flex items-center justify-center">
                    <img
                      src={item.submission.photoUrl}
                      alt="Uploaded proof"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.team?.color }} />
                      <span>{item.team?.name}</span>
                    </div>
                    {item.submission.answerData?.caption && (
                      <p className="text-xs text-slate-400 italic mt-1">
                        "{item.submission.answerData.caption}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
