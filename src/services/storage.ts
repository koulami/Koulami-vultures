import { GameState, Submission, TimerState, Question, Team } from '../types/game';
import { INITIAL_GAME_STATE } from '../data/defaultGame';
import { translateGreekToEnglish, translateQuestionAsync, containsGreekCharacters } from '../utils/translator';

const STORAGE_KEY = 'boundpad_gamestate_v1';
const BACKUP_KEY = 'boundpad_gamestate_backup_v1';
const CUSTOM_QUESTIONS_KEY = 'boundpad_custom_questions_v1';
const UNDO_HISTORY_KEY = 'boundpad_undo_history_v1';
const CHANNEL_NAME = 'boundpad_realtime_channel';

class GameSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(state: GameState) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      if ('BroadcastChannel' in window) {
        try {
          this.channel = new BroadcastChannel(CHANNEL_NAME);
          this.channel.onmessage = (event) => {
            if (event.data && event.data.type === 'SYNC_STATE') {
              this.notifyListeners(event.data.state);
            }
          };
        } catch {
          // BroadcastChannel unsupported or restricted
        }
      }
    }
  }

  loadState(): GameState {
    if (typeof window === 'undefined') return INITIAL_GAME_STATE;
    try {
      let saved = localStorage.getItem(STORAGE_KEY);
      // Fallback to backup if primary storage key was corrupted or emptied
      if (!saved) {
        saved = localStorage.getItem(BACKUP_KEY);
      }

      const defaultQuestionsMap = new Map(INITIAL_GAME_STATE.questions.map((q) => [q.id, q]));
      const defaultTeamsMap = new Map(INITIAL_GAME_STATE.teams.map((t) => [t.id, t]));

      // Also retrieve any custom questions saved in dedicated persistent backup
      const persistentCustomQuestions: Question[] = [];
      try {
        const customRaw = localStorage.getItem(CUSTOM_QUESTIONS_KEY);
        if (customRaw) {
          const parsedCustom = JSON.parse(customRaw);
          if (Array.isArray(parsedCustom)) {
            persistentCustomQuestions.push(...parsedCustom);
          }
        }
      } catch {
        // ignore
      }

      if (saved) {
        const parsed = JSON.parse(saved);

        // Collect all questions: loaded + custom backup + default questions
        const loadedQuestions: Question[] = Array.isArray(parsed.questions) ? parsed.questions : [];
        const questionMap = new Map<string, Question>();

        // 1. Put loaded questions (preserves user created and edited questions 100% untouched)
        loadedQuestions.forEach((q) => {
          questionMap.set(q.id, q);
        });

        // 2. Put persistent custom questions if missing
        persistentCustomQuestions.forEach((cq) => {
          if (!questionMap.has(cq.id)) {
            questionMap.set(cq.id, cq);
          }
        });

        // 3. Ensure all default questions exist (including Team 4 questions)
        INITIAL_GAME_STATE.questions.forEach((defQ) => {
          if (!questionMap.has(defQ.id)) {
            questionMap.set(defQ.id, defQ);
          }
        });

        const mergedQuestions = Array.from(questionMap.values());

        // Merge teams
        const mergedTeams = (Array.isArray(parsed.teams) && parsed.teams.length > 0
          ? parsed.teams
          : INITIAL_GAME_STATE.teams
        ).map((t: any) => {
          const def = defaultTeamsMap.get(t.id);
          if (!def) return t;
          return {
            ...t,
            name_en: t.name_en || def.name_en,
            slogan_en: t.slogan_en !== undefined ? t.slogan_en : def.slogan_en
          };
        });

        return {
          ...INITIAL_GAME_STATE,
          ...parsed,
          title_en: parsed.title_en || INITIAL_GAME_STATE.title_en,
          description_en: parsed.description_en || INITIAL_GAME_STATE.description_en,
          phase: parsed.phase || INITIAL_GAME_STATE.phase,
          synthesisPrompt: parsed.synthesisPrompt ?? INITIAL_GAME_STATE.synthesisPrompt,
          synthesisPrompt_en: parsed.synthesisPrompt_en || INITIAL_GAME_STATE.synthesisPrompt_en,
          synthesisNotes: Array.isArray(parsed.synthesisNotes) ? parsed.synthesisNotes : [],
          questions: mergedQuestions,
          teams: mergedTeams,
          submissions: parsed.submissions || {},
          teamQuestionOrders: parsed.teamQuestionOrders || {},
          teamSequentialModes: parsed.teamSequentialModes || {}
        };
      } else if (persistentCustomQuestions.length > 0) {
        return {
          ...INITIAL_GAME_STATE,
          questions: [...INITIAL_GAME_STATE.questions, ...persistentCustomQuestions]
        };
      }
    } catch (err) {
      console.warn('Could not read state from primary storage, checking backup...', err);
      try {
        const backup = localStorage.getItem(BACKUP_KEY);
        if (backup) {
          const parsed = JSON.parse(backup);
          return {
            ...INITIAL_GAME_STATE,
            ...parsed,
            questions: parsed.questions?.length ? parsed.questions : INITIAL_GAME_STATE.questions,
            teams: parsed.teams?.length ? parsed.teams : INITIAL_GAME_STATE.teams,
            submissions: parsed.submissions || {}
          };
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_GAME_STATE;
  }

  saveState(state: GameState) {
    if (typeof window === 'undefined') return;
    try {
      const serialized = JSON.stringify(state);
      // Save primary
      localStorage.setItem(STORAGE_KEY, serialized);
      // Dual-write redundancy backup to prevent data loss
      localStorage.setItem(BACKUP_KEY, serialized);

      // Save custom user questions to an independent indestructible backup key
      const defaultIds = new Set(INITIAL_GAME_STATE.questions.map((q) => q.id));
      const customQuestions = state.questions.filter((q) => !defaultIds.has(q.id));
      if (customQuestions.length > 0) {
        localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(customQuestions));
      }

      // Rolling snapshot checkpoints (preserves up to 40 checkpoints, captured frequently)
      try {
        const historyRaw = localStorage.getItem(UNDO_HISTORY_KEY);
        const historyList: Array<{ timestamp: number; state: GameState; label?: string }> = historyRaw ? JSON.parse(historyRaw) : [];
        const lastSnap = historyList[historyList.length - 1];
        const isQuestionCountChanged = lastSnap && lastSnap.state.questions.length !== state.questions.length;
        const isElapsed = !lastSnap || Date.now() - lastSnap.timestamp > 2500;

        if (!lastSnap || isQuestionCountChanged || isElapsed) {
          historyList.push({ timestamp: Date.now(), state });
          if (historyList.length > 40) historyList.shift();
          localStorage.setItem(UNDO_HISTORY_KEY, JSON.stringify(historyList));
        }
      } catch {
        // ignore
      }

      if (this.channel) {
        this.channel.postMessage({ type: 'SYNC_STATE', state });
      }
      this.notifyListeners(state);
    } catch (err) {
      console.error('AutoSave failed (storage limit or disabled):', err);
    }
  }

  async syncAllQuestionsTranslations(currentState: GameState): Promise<GameState> {
    const updatedQuestions = await Promise.all(
      currentState.questions.map(async (q) => {
        const def = INITIAL_GAME_STATE.questions.find((dq) => dq.id === q.id);
        const isCustomized = !def || (q.title && q.title !== def.title) || (q.description && q.description !== def.description);
        const titleHasGreek = containsGreekCharacters(q.title_en || '');
        const missingTitleEn = !q.title_en || titleHasGreek;
        const staleTemplateTitle = !!(isCustomized && def && q.title_en === def.title_en);
        const missingPayloadEn = !q.payload_en && (q.type === 'multiple_choice' || q.type === 'task' || q.type === 'text_match');

        if (missingTitleEn || staleTemplateTitle || missingPayloadEn) {
          try {
            const trans = await translateQuestionAsync(q);
            return {
              ...q,
              title_en: trans.title_en || q.title_en,
              description_en: trans.description_en || q.description_en,
              explanation_en: trans.explanation_en !== undefined ? trans.explanation_en : q.explanation_en,
              payload_en: trans.payload_en || q.payload_en
            };
          } catch {
            return q;
          }
        }
        return q;
      })
    );

    const updatedState: GameState = {
      ...currentState,
      questions: updatedQuestions,
      updatedAt: Date.now()
    };

    this.saveState(updatedState);
    return updatedState;
  }

  createManualCheckpoint(state: GameState, label?: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const historyRaw = localStorage.getItem(UNDO_HISTORY_KEY);
      const historyList: Array<{ timestamp: number; state: GameState; label?: string }> = historyRaw
        ? JSON.parse(historyRaw)
        : [];
      historyList.push({
        timestamp: Date.now(),
        state,
        label: label || `Χειροκίνητο Checkpoint (${state.questions.length} ερωτήσεις)`
      });
      if (historyList.length > 40) historyList.shift();
      localStorage.setItem(UNDO_HISTORY_KEY, JSON.stringify(historyList));
      return true;
    } catch {
      return false;
    }
  }

  getSnapshots(): Array<{ timestamp: number; state: GameState; label?: string }> {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(UNDO_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // Backup snapshot as JSON file download
  exportBackupFile(state: GameState, filename = `boundpad-backup-${new Date().toISOString().slice(0, 10)}.json`) {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      return true;
    } catch {
      return false;
    }
  }

  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(state: GameState) {
    this.listeners.forEach((fn) => fn(state));
  }
}

export const syncService = new GameSyncService();
