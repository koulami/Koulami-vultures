export type Language = 'el' | 'en';

export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'text_match'
  | 'image_match'
  | 'qr_scan'
  | 'photo_upload'
  | 'puzzle'
  | 'task';

export interface MultipleChoicePayload {
  options: string[];
  correctOptionIndex?: number;
  correctOptionIndices?: number[];
}

export function getMultipleChoiceCorrectIndices(payload: MultipleChoicePayload): number[] {
  if (Array.isArray(payload.correctOptionIndices) && payload.correctOptionIndices.length > 0) {
    return payload.correctOptionIndices;
  }
  if (typeof payload.correctOptionIndex === 'number') {
    return [payload.correctOptionIndex];
  }
  return [0];
}

export interface TrueFalsePayload {
  correctValue: boolean;
}

export interface TextMatchPair {
  id: string;
  left: string;
  right: string;
}

export interface TextMatchPayload {
  pairs: TextMatchPair[];
}

export interface ImageMatchPair {
  id: string;
  image: string;
  text: string;
}

export interface ImageMatchPayload {
  pairs: ImageMatchPair[];
}

export type QrMediaType = 'image' | 'video';

export interface QrScanMedia {
  type: QrMediaType;
  url: string;
  title?: string;
  caption?: string;
}

export interface QrScanPayload {
  targetCode: string;
  locationHint?: string;
  unlockedMedia?: QrScanMedia;
  unlockedImageUrl?: string;
  unlockedVideoUrl?: string;
}

export interface PhotoUploadPayload {
  instructions: string;
  sampleReferenceUrl?: string;
}

export interface PuzzlePayload {
  imageUrl: string;
  gridPieces: 4 | 6 | 9; // 4 (2x2), 6 (3x2), 9 (3x3)
  pieceShape?: 'standard' | 'classic';
}

export interface TaskPayload {
  instructions: string; // The mission objective & instructions
  checklist?: string[]; // Step-by-step checklist / checkpoints to complete
  requiresEvidence?: 'text' | 'photo' | 'both' | 'confirmation_only'; // Submission requirement
  minWords?: number;
  completionPrompt?: string; // Prompt for team's report/findings
}

export interface Question {
  id: string;
  title: string;
  description: string;
  type: QuestionType;
  points: number;
  imageUrl?: string; // Optional image for multiple_choice, true_false, task, etc.
  assignedTeamIds?: string[]; // If empty or undefined, applies to all teams
  isActive?: boolean; // If false, question is temporarily disabled/hidden
  payload:
    | MultipleChoicePayload
    | TrueFalsePayload
    | TextMatchPayload
    | ImageMatchPayload
    | QrScanPayload
    | PhotoUploadPayload
    | PuzzlePayload
    | TaskPayload;
  explanation?: string;
  // English localization
  title_en?: string;
  description_en?: string;
  explanation_en?: string;
  payload_en?: any;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  avatar: string;
  slogan?: string;
  name_en?: string;
  slogan_en?: string;
  questionOrder?: string[]; // IDs of questions in sequence for this team
  sequentialProgression?: boolean; // If true, team must answer questions in order
}

export interface Submission {
  id: string;
  teamId: string;
  questionId: string;
  submittedAt: number;
  status: 'correct' | 'incorrect' | 'completed' | 'pending';
  scoreEarned: number;
  answerData: any;
  photoUrl?: string;
  puzzleStats?: {
    moves: number;
    durationSeconds: number;
  };
  feedbackNote?: string;
}

export interface TimerState {
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  updatedAt: number;
}

export type GamePhase = 'waiting_lobby' | 'in_progress' | 'synthesis' | 'discussion';

export interface TeamSynthesisNote {
  id: string;
  teamId: string;
  title: string;
  content: string;
  createdAt: number;
  author?: string;
  imageUrl?: string;
  likes?: number;
  feedbackComment?: string;
}

export interface GameState {
  id: string;
  title: string;
  description: string;
  title_en?: string;
  description_en?: string;
  phase: GamePhase;
  synthesisPrompt?: string;
  synthesisPrompt_en?: string;
  synthesisNotes: TeamSynthesisNote[];
  teams: Team[];
  questions: Question[];
  submissions: Record<string, Submission>; // key: `${teamId}_${questionId}`
  teamQuestionOrders?: Record<string, string[]>; // teamId -> ordered array of questionIds
  teamSequentialModes?: Record<string, boolean>; // teamId -> boolean (true: answer in order step-by-step)
  timer: TimerState;
  activeRound: number;
  updatedAt: number;
}

export type ViewMode = 'padlet_board' | 'team_play' | 'projector' | 'discussion' | 'admin';
