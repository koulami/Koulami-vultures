import React, { useState, useEffect, useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import { GameState, ViewMode, Language, Question, Team, Submission, GamePhase, TeamSynthesisNote } from './types/game';
import { INITIAL_GAME_STATE } from './data/defaultGame';
import { translations } from './locales/translations';
import { syncService } from './services/storage';
import { sound } from './services/sound';
import { getLocalizedGameState, getLocalizedQuestion, getLocalizedTeam } from './utils/localizedGame';
import { translateGreekToEnglish, translateGreekToEnglishAsync, translateQuestionAsync, containsGreekCharacters } from './utils/translator';
import { TopBar } from './components/TopBar';
import { TeamColumn } from './components/TeamColumn';
import { ProjectorView } from './components/ProjectorView';
import { TeamPlayerView } from './components/TeamPlayerView';
import { AdminPanel } from './components/AdminPanel';
import { DiscussionShowcaseView } from './components/DiscussionShowcaseView';
import { QuestSolverModal } from './components/QuestSolverModal';
import { TeamJoinLobbyModal } from './components/TeamJoinLobbyModal';
import { TeamEditorModal } from './components/TeamEditorModal';
import { QuestionEditorModal } from './components/QuestionEditorModal';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => syncService.loadState());
  const [history, setHistory] = useState<GameState[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('padlet_board');
  const [lang, setLang] = useState<Language>('el');
  const [activeTeamId, setActiveTeamId] = useState<string>(() => {
    return gameState.teams[0]?.id || 'team-alpha';
  });
  const [activeModalQuest, setActiveModalQuest] = useState<{
    question: Question;
    team: Team;
  } | null>(null);
  const [showJoinQrModal, setShowJoinQrModal] = useState<boolean>(false);
  const [editingTeamOnBoard, setEditingTeamOnBoard] = useState<Team | null>(null);
  const [editingQuestOnBoard, setEditingQuestOnBoard] = useState<{ question: Question; initialTab?: 'both' | 'el' | 'en' } | null>(null);

  const t = translations[lang];

  // Detect URL parameter (?join=true or ?team=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('join') === 'true') {
        setViewMode('team_play');
      }
      const teamParam = params.get('team');
      if (teamParam && gameState.teams.some(t => t.id === teamParam)) {
        setActiveTeamId(teamParam);
        setViewMode('team_play');
      }
    }
  }, [gameState.teams]);

  // Listen to multi-tab / real-time updates
  useEffect(() => {
    const unsubscribe = syncService.subscribe((newState) => {
      setGameState(newState);
    });
    return () => unsubscribe();
  }, []);

  // Synchronized countdown timer interval
  useEffect(() => {
    if (!gameState.timer.isRunning) return;

    const timerInterval = setInterval(() => {
      setGameState((prevState) => {
        if (!prevState.timer.isRunning) return prevState;

        const nextRemaining = Math.max(0, prevState.timer.remainingSeconds - 1);
        const hasJustEnded = nextRemaining === 0 && prevState.timer.remainingSeconds > 0;

        if (hasJustEnded) {
          sound.playTimerAlert();
        }

        const nextState: GameState = {
          ...prevState,
          timer: {
            ...prevState.timer,
            remainingSeconds: nextRemaining,
            isRunning: nextRemaining > 0,
            updatedAt: Date.now()
          }
        };

        // Sync every 5 seconds or when ended to save CPU/storage
        if (nextRemaining % 5 === 0 || nextRemaining === 0) {
          syncService.saveState(nextState);
        }

        return nextState;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [gameState.timer.isRunning]);

  // Persist state mutations with undo history tracking
  const updateAndSyncState = (updater: (prev: GameState) => GameState, recordHistory = true) => {
    setGameState((prev) => {
      if (recordHistory) {
        setHistory((h) => [...h.slice(-20), prev]);
      }
      const next = updater(prev);
      syncService.saveState(next);
      return next;
    });
  };

  // Revert to previous state
  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setGameState(previousState);
    syncService.saveState(previousState);
  };

  // Full backup restore
  const handleRestoreBackup = (restored: GameState) => {
    setHistory((h) => [...h.slice(-20), gameState]);
    setGameState(restored);
    syncService.saveState(restored);
  };

  // Recover and merge all default quests (ensures Team 1, 2, 3, 4 default activities exist without losing custom ones)
  const handleRestoreDefaultQuests = () => {
    setHistory((h) => [...h.slice(-20), gameState]);
    const currentMap = new Map(gameState.questions.map((q) => [q.id, q]));
    INITIAL_GAME_STATE.questions.forEach((defQ) => {
      if (!currentMap.has(defQ.id)) {
        currentMap.set(defQ.id, defQ);
      }
    });
    const updatedState: GameState = {
      ...gameState,
      questions: Array.from(currentMap.values())
    };
    setGameState(updatedState);
    syncService.saveState(updatedState);
  };

  // Bulk auto-translate all questions and game text into English
  const handleBulkAutoTranslate = async () => {
    setHistory((h) => [...h.slice(-20), gameState]);

    const updatedQuestions = await Promise.all(
      gameState.questions.map(async (q) => {
        try {
          const trans = await translateQuestionAsync(q);
          return {
            ...q,
            title_en: trans.title_en || q.title_en || q.title,
            description_en: trans.description_en || q.description_en || q.description,
            explanation_en: trans.explanation_en !== undefined ? trans.explanation_en : q.explanation_en,
            payload_en: trans.payload_en || q.payload_en
          };
        } catch (e) {
          console.error('Failed translating question in bulk:', q.id, e);
          return q;
        }
      })
    );

    const [gameTitleEn, gameDescEn, synthPromptEn] = await Promise.all([
      gameState.title ? translateGreekToEnglishAsync(gameState.title) : Promise.resolve(''),
      gameState.description ? translateGreekToEnglishAsync(gameState.description) : Promise.resolve(''),
      gameState.synthesisPrompt ? translateGreekToEnglishAsync(gameState.synthesisPrompt) : Promise.resolve('')
    ]);

    const updatedTeams = await Promise.all(
      gameState.teams.map(async (t) => ({
        ...t,
        name_en: t.name ? await translateGreekToEnglishAsync(t.name) : t.name,
        slogan_en: t.slogan ? await translateGreekToEnglishAsync(t.slogan) : undefined
      }))
    );

    const updatedState: GameState = {
      ...gameState,
      title_en: gameTitleEn || gameState.title,
      description_en: gameDescEn || gameState.description,
      synthesisPrompt_en: synthPromptEn || undefined,
      teams: updatedTeams,
      questions: updatedQuestions,
      updatedAt: Date.now()
    };

    setGameState(updatedState);
    syncService.saveState(updatedState);
  };

  // Timer controls
  const handleStartTimer = () => {
    updateAndSyncState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        isRunning: true,
        remainingSeconds: prev.timer.remainingSeconds <= 0 ? prev.timer.totalSeconds : prev.timer.remainingSeconds,
        updatedAt: Date.now()
      }
    }));
  };

  const handlePauseTimer = () => {
    updateAndSyncState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        isRunning: false,
        updatedAt: Date.now()
      }
    }));
  };

  const handleToggleTimer = () => {
    if (gameState.timer.isRunning) {
      handlePauseTimer();
    } else {
      handleStartTimer();
    }
  };

  const handleResetTimer = () => {
    updateAndSyncState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        remainingSeconds: prev.timer.totalSeconds,
        isRunning: false,
        updatedAt: Date.now()
      }
    }));
  };

  const handleSetTimerDuration = (seconds: number) => {
    updateAndSyncState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        totalSeconds: seconds,
        remainingSeconds: seconds,
        isRunning: false,
        updatedAt: Date.now()
      }
    }));
  };

  // Phase Controller
  const handleSetPhase = (phase: GamePhase) => {
    updateAndSyncState((prev) => ({
      ...prev,
      phase,
      updatedAt: Date.now()
    }));
  };

  const handleSimultaneousStart = () => {
    sound.playFanfare();
    updateAndSyncState((prev) => ({
      ...prev,
      phase: 'in_progress',
      timer: {
        ...prev.timer,
        isRunning: true,
        remainingSeconds: prev.timer.remainingSeconds <= 0 ? prev.timer.totalSeconds : prev.timer.remainingSeconds,
        updatedAt: Date.now()
      },
      updatedAt: Date.now()
    }));
  };

  const handleSetSynthesisPrompt = (prompt: string, promptEn?: string) => {
    updateAndSyncState((prev) => ({
      ...prev,
      synthesisPrompt: prompt,
      synthesisPrompt_en: promptEn !== undefined ? promptEn : prev.synthesisPrompt_en,
      updatedAt: Date.now()
    }));
  };

  // Synthesis Note handlers
  const handleAddSynthesisNote = (noteData: Omit<TeamSynthesisNote, 'id' | 'createdAt'>) => {
    const newNote: TeamSynthesisNote = {
      ...noteData,
      id: `note-${Date.now()}`,
      createdAt: Date.now(),
      likes: 0
    };
    updateAndSyncState((prev) => ({
      ...prev,
      synthesisNotes: [newNote, ...prev.synthesisNotes],
      updatedAt: Date.now()
    }));
  };

  const handleDeleteSynthesisNote = (noteId: string) => {
    updateAndSyncState((prev) => ({
      ...prev,
      synthesisNotes: prev.synthesisNotes.filter((n) => n.id !== noteId),
      updatedAt: Date.now()
    }));
  };

  const handleLikeSynthesisNote = (noteId: string) => {
    updateAndSyncState((prev) => ({
      ...prev,
      synthesisNotes: prev.synthesisNotes.map((n) => {
        if (n.id === noteId) {
          return { ...n, likes: (n.likes || 0) + 1 };
        }
        return n;
      }),
      updatedAt: Date.now()
    }));
  };

  const handleAddTeacherFeedback = (noteId: string, feedback: string) => {
    updateAndSyncState((prev) => ({
      ...prev,
      synthesisNotes: prev.synthesisNotes.map((n) => {
        if (n.id === noteId) {
          return { ...n, feedbackComment: feedback };
        }
        return n;
      }),
      updatedAt: Date.now()
    }));
  };

  // Submission handler
  const handleSubmitQuest = (questionId: string, teamId: string, data: Partial<Submission>) => {
    updateAndSyncState((prev) => {
      const submissionKey = `${teamId}_${questionId}`;
      const newSubmission: Submission = {
        id: submissionKey,
        teamId,
        questionId,
        submittedAt: Date.now(),
        status: data.status || 'completed',
        scoreEarned: data.scoreEarned ?? 0,
        answerData: data.answerData,
        photoUrl: data.photoUrl,
        puzzleStats: data.puzzleStats,
        feedbackNote: data.feedbackNote
      };

      return {
        ...prev,
        submissions: {
          ...prev.submissions,
          [submissionKey]: newSubmission
        },
        updatedAt: Date.now()
      };
    });
  };

  // Reset Facilitator handlers
  const handleResetAllSubmissions = () => {
    updateAndSyncState((prev) => ({
      ...prev,
      submissions: {},
      synthesisNotes: [],
      activeRound: prev.activeRound + 1,
      phase: 'waiting_lobby',
      updatedAt: Date.now()
    }));
  };

  const handleResetTeamSubmissions = (teamId: string) => {
    updateAndSyncState((prev) => {
      const filteredSubmissions: Record<string, Submission> = {};
      Object.entries(prev.submissions).forEach(([key, sub]) => {
        if (sub.teamId !== teamId) {
          filteredSubmissions[key] = sub;
        }
      });
      return {
        ...prev,
        submissions: filteredSubmissions,
        synthesisNotes: prev.synthesisNotes.filter((n) => n.teamId !== teamId),
        updatedAt: Date.now()
      };
    });
  };

  // Question handlers
  const handleAddQuestion = (question: Question) => {
    updateAndSyncState((prev) => ({
      ...prev,
      questions: [...prev.questions, question],
      updatedAt: Date.now()
    }));
  };

  const handleUpdateQuestion = (updatedQuestion: Question) => {
    updateAndSyncState((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q)),
      updatedAt: Date.now()
    }));
  };

  const handleToggleQuestionActive = (questionId: string) => {
    updateAndSyncState((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => {
        if (q.id === questionId) {
          const currentActive = q.isActive !== false;
          return { ...q, isActive: !currentActive };
        }
        return q;
      }),
      updatedAt: Date.now()
    }));
  };

  const handleDeleteQuestion = (questionId: string) => {
    updateAndSyncState((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
      updatedAt: Date.now()
    }));
  };

  // Team handlers
  const handleAddTeam = (team: Team) => {
    updateAndSyncState((prev) => ({
      ...prev,
      teams: [...prev.teams, team],
      updatedAt: Date.now()
    }));
  };

  const handleUpdateTeam = (updatedTeam: Team) => {
    updateAndSyncState((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => (t.id === updatedTeam.id ? updatedTeam : t)),
      updatedAt: Date.now()
    }));
  };

  const handleDeleteTeam = (teamId: string) => {
    updateAndSyncState((prev) => ({
      ...prev,
      teams: prev.teams.filter((t) => t.id !== teamId),
      updatedAt: Date.now()
    }));
  };

  // Team question order and progression handlers
  const handleSetTeamQuestionOrder = (teamId: string, questionIds: string[]) => {
    updateAndSyncState((prev) => ({
      ...prev,
      teamQuestionOrders: {
        ...(prev.teamQuestionOrders || {}),
        [teamId]: questionIds
      },
      updatedAt: Date.now()
    }));
  };

  const handleSetTeamSequentialMode = (teamId: string, isSequential: boolean) => {
    updateAndSyncState((prev) => ({
      ...prev,
      teamSequentialModes: {
        ...(prev.teamSequentialModes || {}),
        [teamId]: isSequential
      },
      updatedAt: Date.now()
    }));
  };

  const handleApplyOrderToAllTeams = (questionIds: string[]) => {
    updateAndSyncState((prev) => {
      const newOrders: Record<string, string[]> = {};
      prev.teams.forEach((t) => {
        newOrders[t.id] = [...questionIds];
      });
      return {
        ...prev,
        teamQuestionOrders: newOrders,
        updatedAt: Date.now()
      };
    });
  };

  const handleApplyStationRotation = () => {
    updateAndSyncState((prev) => {
      const newOrders: Record<string, string[]> = {};
      prev.teams.forEach((team, teamIdx) => {
        const teamQuestions = prev.questions
          .filter(
            (q) =>
              q.isActive !== false &&
              (!q.assignedTeamIds ||
                q.assignedTeamIds.length === 0 ||
                q.assignedTeamIds.includes(team.id))
          )
          .map((q) => q.id);

        if (teamQuestions.length > 0) {
          const shift = teamIdx % teamQuestions.length;
          const rotated = [
            ...teamQuestions.slice(shift),
            ...teamQuestions.slice(0, shift)
          ];
          newOrders[team.id] = rotated;
        }
      });

      return {
        ...prev,
        teamQuestionOrders: newOrders,
        updatedAt: Date.now()
      };
    });
  };

  const localizedGameState = useMemo(
    () => getLocalizedGameState(gameState, lang),
    [gameState, lang]
  );

  const activeTeam = localizedGameState.teams.find((t) => t.id === activeTeamId) || localizedGameState.teams[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* 3-Zone Top Bar */}
      <TopBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        lang={lang}
        onLanguageChange={setLang}
        timer={gameState.timer}
        phase={gameState.phase}
        onToggleTimer={handleToggleTimer}
        onOpenJoinQr={() => setShowJoinQrModal(true)}
        onSimultaneousStart={handleSimultaneousStart}
        canUndo={history.length > 0}
        onUndo={handleUndo}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* MODE 1: PADLET BOARD VIEW */}
        {viewMode === 'padlet_board' && (
          <div className="flex-1 p-4 sm:p-6 space-y-4 flex flex-col">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
                  <span>{localizedGameState.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    {t.liveSynced}
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {localizedGameState.description} · {localizedGameState.questions.filter(q => q.isActive !== false).length}/{localizedGameState.questions.length} {lang === 'el' ? 'ενεργές αποστολές' : 'active quests'}
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setLang(lang === 'el' ? 'en' : 'el')}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-600/50 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  title={lang === 'el' ? 'Προβολή ολόκληρου του πίνακα στα Αγγλικά' : 'Επιστροφή στα Ελληνικά'}
                >
                  <span>{lang === 'el' ? '🇬🇧 Δες στα Αγγλικά' : '🇬🇷 Δες στα Ελληνικά'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('admin')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/25 cursor-pointer ring-1 ring-amber-400/50"
                  title={lang === 'el' ? 'Κονσόλα Διαχειριστή: Επεξεργασία ερωτήσεων, ονομάτων ομάδων και ρυθμίσεων' : 'Facilitator Console: Edit questions, team names, and settings'}
                >
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                  <span>{lang === 'el' ? '⚙️ Κονσόλα Διαχειριστή' : '⚙️ Facilitator Console'}</span>
                </button>

                <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-700">
                  <span className="text-xs text-slate-400 hidden sm:inline">{t.selectYourTeam}:</span>
                  <select
                    value={activeTeamId}
                    onChange={(e) => setActiveTeamId(e.target.value)}
                    className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none"
                  >
                    {localizedGameState.teams.map((tm) => (
                      <option key={tm.id} value={tm.id} className="bg-slate-900 text-slate-100">
                        {tm.avatar} {tm.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Horizontal scrollable columns for each team */}
            <div className="flex-1 flex gap-4 overflow-x-auto pb-4 pt-1 items-start no-scrollbar">
              {localizedGameState.teams.map((team) => (
                <TeamColumn
                  key={team.id}
                  team={team}
                  questions={localizedGameState.questions}
                  submissions={gameState.submissions}
                  lang={lang}
                  isInteractive={true}
                  teamQuestionOrders={gameState.teamQuestionOrders}
                  teamSequentialModes={gameState.teamSequentialModes}
                  onEditTeam={(tm) => setEditingTeamOnBoard(tm)}
                  onEditQuest={(quest, tab) => {
                    const rawQuest = gameState.questions.find((q) => q.id === quest.id) || quest;
                    setEditingQuestOnBoard({ question: rawQuest, initialTab: tab || 'both' });
                  }}
                  onOpenQuest={(quest) => {
                    setActiveModalQuest({ question: quest, team });
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* MODE 2: TEAM PLAYER VIEW (Mobile & Individual Team Focused with Lobby & Synthesis) */}
        {viewMode === 'team_play' && (
          <TeamPlayerView
            gameState={localizedGameState}
            activeTeamId={activeTeamId}
            onSelectTeam={setActiveTeamId}
            lang={lang}
            onSubmitQuest={handleSubmitQuest}
            onAddSynthesisNote={handleAddSynthesisNote}
            onDeleteSynthesisNote={handleDeleteSynthesisNote}
            onLikeSynthesisNote={handleLikeSynthesisNote}
          />
        )}

        {/* MODE 3: SHARED PROJECTOR SCREEN */}
        {viewMode === 'projector' && (
          <ProjectorView
            gameState={localizedGameState}
            lang={lang}
          />
        )}

        {/* MODE 4: CLASSROOM DISCUSSION & DEBRIEF PADLET */}
        {viewMode === 'discussion' && (
          <DiscussionShowcaseView
            gameState={localizedGameState}
            lang={lang}
            onLikeNote={handleLikeSynthesisNote}
            onAddTeacherFeedback={handleAddTeacherFeedback}
          />
        )}

        {/* MODE 5: FACILITATOR / ADMIN PANEL */}
        {viewMode === 'admin' && (
          <AdminPanel
            gameState={gameState}
            lang={lang}
            onLanguageChange={setLang}
            onResetAllSubmissions={handleResetAllSubmissions}
            onResetTeamSubmissions={handleResetTeamSubmissions}
            onStartTimer={handleStartTimer}
            onPauseTimer={handlePauseTimer}
            onResetTimer={handleResetTimer}
            onSetTimerDuration={handleSetTimerDuration}
            onAddQuestion={handleAddQuestion}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onToggleQuestionActive={handleToggleQuestionActive}
            onAddTeam={handleAddTeam}
            onUpdateTeam={handleUpdateTeam}
            onDeleteTeam={handleDeleteTeam}
            onSetPhase={handleSetPhase}
            onSetSynthesisPrompt={handleSetSynthesisPrompt}
            onOpenJoinQr={() => setShowJoinQrModal(true)}
            onSetTeamQuestionOrder={handleSetTeamQuestionOrder}
            onSetTeamSequentialMode={handleSetTeamSequentialMode}
            onApplyOrderToAllTeams={handleApplyOrderToAllTeams}
            onApplyStationRotation={handleApplyStationRotation}
            canUndo={history.length > 0}
            onUndo={handleUndo}
            onRestoreBackup={handleRestoreBackup}
            onRestoreDefaultQuests={handleRestoreDefaultQuests}
            onBulkAutoTranslate={handleBulkAutoTranslate}
            onClose={() => setViewMode('padlet_board')}
          />
        )}
      </main>

      {/* Team Editor Modal (when clicking edit directly on the board) */}
      {editingTeamOnBoard && (
        <TeamEditorModal
          team={editingTeamOnBoard}
          isOpen={!!editingTeamOnBoard}
          lang={lang}
          onClose={() => setEditingTeamOnBoard(null)}
          onSave={(savedTeam) => {
            handleUpdateTeam(savedTeam);
            setEditingTeamOnBoard(null);
          }}
        />
      )}

      {/* Direct Board Question Editor Modal (allows editing or EN editing from the Padlet board) */}
      {editingQuestOnBoard && (
        <QuestionEditorModal
          question={editingQuestOnBoard.question}
          teams={gameState.teams}
          lang={lang}
          initialTab={editingQuestOnBoard.initialTab}
          onSave={(savedQuest) => {
            handleUpdateQuestion(savedQuest);
            setEditingQuestOnBoard(null);
          }}
          onClose={() => setEditingQuestOnBoard(null)}
        />
      )}

      {/* Floating Quick Facilitator / Admin Button - Always visible regardless of scroll or screen size */}
      {viewMode !== 'admin' && (
        <button
          type="button"
          onClick={() => setViewMode('admin')}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-amber-500/50 hover:border-amber-400 shadow-2xl backdrop-blur-md text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 group"
          title={lang === 'el' ? 'Κονσόλα Διαχειριστή: Επεξεργασία ερωτήσεων, ονομάτων ομάδων και ρυθμίσεων' : 'Facilitator Console: Edit quests, team names, and settings'}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span>{lang === 'el' ? '⚙️ Διαχειριστής' : '⚙️ Facilitator'}</span>
        </button>
      )}

      {/* Quest Solver Modal */}
      {activeModalQuest && (
        <QuestSolverModal
          question={getLocalizedQuestion(activeModalQuest.question, lang)}
          team={getLocalizedTeam(activeModalQuest.team, lang)}
          existingSubmission={
            gameState.submissions[`${activeModalQuest.team.id}_${activeModalQuest.question.id}`]
          }
          lang={lang}
          onClose={() => setActiveModalQuest(null)}
          onSubmit={(submissionData) => {
            handleSubmitQuest(
              activeModalQuest.question.id,
              activeModalQuest.team.id,
              submissionData
            );
            if (activeModalQuest.question.type !== 'qr_scan') {
              setActiveModalQuest(null);
            }
          }}
        />
      )}

      {/* Team Join / QR Code Lobby Modal */}
      {showJoinQrModal && (
        <TeamJoinLobbyModal
          gameState={localizedGameState}
          activeTeam={activeTeam}
          onSelectTeam={setActiveTeamId}
          lang={lang}
          isFacilitator={true}
          onClose={() => setShowJoinQrModal(false)}
          onStartGame={() => {
            handleSimultaneousStart();
            setShowJoinQrModal(false);
          }}
        />
      )}
    </div>
  );
}
