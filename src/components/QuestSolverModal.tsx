import React from 'react';
import { X, Award, HelpCircle } from 'lucide-react';
import { Question, Team, Submission, Language } from '../types/game';
import { translations } from '../locales/translations';
import { MultipleChoiceQuest } from './quests/MultipleChoiceQuest';
import { TrueFalseQuest } from './quests/TrueFalseQuest';
import { TextMatchQuest } from './quests/TextMatchQuest';
import { ImageMatchQuest } from './quests/ImageMatchQuest';
import { QrScanQuest } from './quests/QrScanQuest';
import { PhotoUploadQuest } from './quests/PhotoUploadQuest';
import { PuzzleQuest } from './quests/PuzzleQuest';
import { TaskQuest } from './quests/TaskQuest';

interface Props {
  question: Question;
  team: Team;
  existingSubmission?: Submission;
  lang: Language;
  onClose: () => void;
  onSubmit: (submissionData: Partial<Submission>) => void;
  readOnly?: boolean;
}

export const QuestSolverModal: React.FC<Props> = ({
  question,
  team,
  existingSubmission,
  lang,
  onClose,
  onSubmit,
  readOnly = false
}) => {
  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-4 sticky top-0 bg-slate-900/95 backdrop-blur-sm z-20">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: team.color }}
              />
              <span className="font-semibold text-slate-200">{team.name}</span>
              <span className="text-slate-500">·</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                {question.points} {t.pts}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 leading-snug">
              {question.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors shrink-0"
            title={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quest Body */}
        <div className="p-4 sm:p-6 flex-1">
          {question.type === 'multiple_choice' && (
            <MultipleChoiceQuest
              question={question}
              existingSubmission={existingSubmission}
              lang={lang}
              readOnly={readOnly}
              onSubmit={(res) => {
                onSubmit({
                  status: res.isCorrect ? 'correct' : 'incorrect',
                  scoreEarned: res.points,
                  answerData: {
                    selectedIndex: res.selectedIndex,
                    selectedIndices: res.selectedIndices
                  }
                });
              }}
            />
          )}

          {question.type === 'true_false' && (
            <TrueFalseQuest
              question={question}
              existingSubmission={existingSubmission}
              lang={lang}
              readOnly={readOnly}
              onSubmit={(res) => {
                onSubmit({
                  status: res.isCorrect ? 'correct' : 'incorrect',
                  scoreEarned: res.points,
                  answerData: { selectedValue: res.selectedValue }
                });
              }}
            />
          )}

          {question.type === 'text_match' && (
            <TextMatchQuest
              question={question}
              existingSubmission={existingSubmission}
              lang={lang}
              readOnly={readOnly}
              onSubmit={(res) => {
                onSubmit({
                  status: res.isCorrect ? 'correct' : 'completed',
                  scoreEarned: res.points,
                  answerData: { matchedPairs: res.matchedPairs }
                });
              }}
            />
          )}

          {question.type === 'image_match' && (
            <ImageMatchQuest
              question={question}
              existingSubmission={existingSubmission}
              lang={lang}
              readOnly={readOnly}
              onSubmit={(res) => {
                onSubmit({
                  status: res.isCorrect ? 'correct' : 'completed',
                  scoreEarned: res.points,
                  answerData: { matchedPairs: res.matchedPairs }
                });
              }}
            />
          )}

          {question.type === 'qr_scan' && (
            <QrScanQuest
              question={question}
              existingSubmission={existingSubmission}
              lang={lang}
              readOnly={readOnly}
              onClose={onClose}
              onSubmit={(res) => {
                onSubmit({
                  status: 'correct',
                  scoreEarned: res.points,
                  answerData: { decodedCode: res.decodedCode }
                });
              }}
            />
          )}

          {question.type === 'photo_upload' && (
            <PhotoUploadQuest
              question={question}
              existingSubmission={existingSubmission}
              lang={lang}
              readOnly={readOnly}
              onSubmit={(res) => {
                onSubmit({
                  status: 'completed',
                  scoreEarned: res.points,
                  photoUrl: res.photoUrl,
                  answerData: { photoUrl: res.photoUrl, caption: res.caption }
                });
              }}
            />
          )}

          {question.type === 'puzzle' && (
            <PuzzleQuest
              question={question}
              existingSubmission={existingSubmission}
              lang={lang}
              readOnly={readOnly}
              onSubmit={(res) => {
                onSubmit({
                  status: 'completed',
                  scoreEarned: res.points,
                  puzzleStats: {
                    moves: res.moves,
                    durationSeconds: res.durationSeconds
                  },
                  answerData: { moves: res.moves, durationSeconds: res.durationSeconds, gridPieces: res.gridPieces }
                });
              }}
            />
          )}

          {question.type === 'task' && (
            <TaskQuest
              question={question}
              existingSubmission={existingSubmission}
              lang={lang}
              readOnly={readOnly}
              onSubmit={(res) => {
                onSubmit({
                  status: 'completed',
                  scoreEarned: res.points,
                  photoUrl: res.photoUrl,
                  answerData: {
                    checklistCompleted: res.checklistCompleted,
                    reportText: res.reportText,
                    photoUrl: res.photoUrl
                  }
                });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
