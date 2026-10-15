import React, { useState } from 'react';
import { CheckCircle2, XCircle, Check, HelpCircle, Send } from 'lucide-react';
import { Question, MultipleChoicePayload, Submission, getMultipleChoiceCorrectIndices } from '../../types/game';
import { translations } from '../../locales/translations';
import { sound } from '../../services/sound';

interface Props {
  question: Question;
  existingSubmission?: Submission;
  lang: 'el' | 'en';
  onSubmit: (data: { selectedIndex?: number; selectedIndices: number[]; isCorrect: boolean; points: number }) => void;
  readOnly?: boolean;
}

export const MultipleChoiceQuest: React.FC<Props> = ({
  question,
  existingSubmission,
  lang,
  onSubmit,
  readOnly = false
}) => {
  const t = translations[lang];
  const payload = question.payload as MultipleChoicePayload;
  const correctIndices = getMultipleChoiceCorrectIndices(payload);
  const isMultiple = correctIndices.length > 1;

  // Selected indices array
  const [selectedIndices, setSelectedIndices] = useState<number[]>(() => {
    if (existingSubmission?.answerData) {
      const data = existingSubmission.answerData;
      if (Array.isArray(data.selectedIndices)) {
        return data.selectedIndices;
      }
      if (typeof data.selectedIndex === 'number' && data.selectedIndex >= 0) {
        return [data.selectedIndex];
      }
    }
    return [];
  });

  const [hasSubmitted, setHasSubmitted] = useState<boolean>(!!existingSubmission);

  // Toggle selection
  const handleToggleOption = (index: number) => {
    if (readOnly || hasSubmitted) return;
    if (isMultiple) {
      setSelectedIndices((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index].sort((a, b) => a - b)
      );
    } else {
      setSelectedIndices([index]);
    }
  };

  // Submit choices
  const handleSubmit = () => {
    if (readOnly || hasSubmitted || selectedIndices.length === 0) return;
    setHasSubmitted(true);

    // Exact match: must have all correct indices and no incorrect indices
    const isCorrect =
      selectedIndices.length === correctIndices.length &&
      correctIndices.every((idx) => selectedIndices.includes(idx));

    if (isCorrect) {
      sound.playSuccess();
    } else {
      sound.playError();
    }

    onSubmit({
      selectedIndex: selectedIndices[0] ?? -1,
      selectedIndices,
      isCorrect,
      points: isCorrect ? question.points : 0
    });
  };

  // Whether user's submitted answers are correct
  const isSubmissionCorrect =
    hasSubmitted &&
    selectedIndices.length === correctIndices.length &&
    correctIndices.every((idx) => selectedIndices.includes(idx));

  return (
    <div className="space-y-4">
      {/* Optional Quest Image */}
      {question.imageUrl && (
        <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950 flex items-center justify-center max-h-72">
          <img
            src={question.imageUrl}
            alt={question.title}
            className="w-full h-auto max-h-72 object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-slate-300 leading-relaxed font-normal">
        {question.description}
      </p>

      {/* Helper Banner for Question Type */}
      {!hasSubmitted && (
        <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
          isMultiple
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}>
          <HelpCircle className={`w-4 h-4 shrink-0 ${isMultiple ? 'text-amber-400' : 'text-slate-400'}`} />
          <span>
            {isMultiple ? t.multipleChoiceNotice : t.multipleChoiceSingleNotice}
          </span>
        </div>
      )}

      {/* Options List */}
      <div className="space-y-2.5 pt-1">
        {payload.options.map((option, idx) => {
          const isSelected = selectedIndices.includes(idx);
          const isOneOfCorrect = correctIndices.includes(idx);

          let btnStyle = 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:border-slate-600';
          if (hasSubmitted) {
            if (isOneOfCorrect && isSelected) {
              btnStyle = 'border-emerald-500 bg-emerald-950/70 text-emerald-200 ring-1 ring-emerald-500';
            } else if (isOneOfCorrect && !isSelected) {
              btnStyle = 'border-emerald-700/80 border-dashed bg-emerald-950/30 text-emerald-300';
            } else if (!isOneOfCorrect && isSelected) {
              btnStyle = 'border-rose-500 bg-rose-950/70 text-rose-200 ring-1 ring-rose-500';
            } else {
              btnStyle = 'border-slate-800 bg-slate-900/50 text-slate-500 opacity-60';
            }
          } else if (isSelected) {
            btnStyle = 'border-amber-500 bg-amber-950/40 text-amber-200 ring-1 ring-amber-500 shadow-md shadow-amber-950/20';
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={readOnly || hasSubmitted}
              onClick={() => handleToggleOption(idx)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between text-sm ${btnStyle}`}
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                {/* Visual marker: Checkbox when multiple, Letter or radio badge */}
                {isMultiple ? (
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      hasSubmitted
                        ? isOneOfCorrect && isSelected
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : isOneOfCorrect && !isSelected
                          ? 'border-emerald-500/60 text-emerald-400 bg-emerald-950/50'
                          : isSelected
                          ? 'bg-rose-600 border-rose-500 text-white'
                          : 'border-slate-700 bg-slate-900/40 text-transparent'
                        : isSelected
                        ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-sm'
                        : 'border-slate-600 bg-slate-900/60 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <span
                    className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      hasSubmitted
                        ? isOneOfCorrect
                          ? 'bg-emerald-600 text-white'
                          : isSelected
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-700/80 text-slate-400'
                        : isSelected
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-700/80 text-slate-300'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                )}

                <span className="font-medium leading-snug break-words">{option}</span>
              </div>

              {/* Status Tags & Icons */}
              {hasSubmitted && (
                <div className="flex items-center gap-2 shrink-0">
                  {isOneOfCorrect && isSelected && (
                    <>
                      <span className="hidden sm:inline text-[11px] text-emerald-400 font-medium">
                        {t.multipleChoiceCorrectSelected}
                      </span>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    </>
                  )}
                  {isOneOfCorrect && !isSelected && (
                    <>
                      <span className="hidden sm:inline text-[11px] text-emerald-400/80 italic font-medium">
                        {t.multipleChoiceMissed}
                      </span>
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    </>
                  )}
                  {!isOneOfCorrect && isSelected && (
                    <>
                      <span className="hidden sm:inline text-[11px] text-rose-400 font-medium">
                        {t.multipleChoiceIncorrectSelected}
                      </span>
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    </>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Submission Action Button (active when not submitted) */}
      {!hasSubmitted && !readOnly && (
        <div className="pt-2 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-medium">
            {selectedIndices.length > 0 ? (
              <span className="text-amber-400 font-semibold">
                {t.multipleChoiceSelectedCount}: {selectedIndices.length}
                {isMultiple && ` / ${correctIndices.length} ${t.correctAnswer}`}
              </span>
            ) : (
              <span>{isMultiple ? t.multipleChoiceNotice : t.multipleChoiceSingleNotice}</span>
            )}
          </div>

          <button
            type="button"
            disabled={selectedIndices.length === 0}
            onClick={handleSubmit}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
              selectedIndices.length > 0
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-amber-500/20 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {isMultiple
                ? `${t.submitAnswersMultiple} (${selectedIndices.length})`
                : t.submitAnswer}
            </span>
          </button>
        </div>
      )}

      {/* Results / Feedback Box */}
      {hasSubmitted && (
        <div
          className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 ${
            isSubmissionCorrect
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800 text-rose-300'
          }`}
        >
          <div className="font-semibold text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSubmissionCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    {t.statusCorrect} (+{question.points} {t.pts})
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>
                    {t.statusIncorrect} (+0 {t.pts})
                  </span>
                </>
              )}
            </div>
            {isMultiple && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900/80 border border-current font-mono">
                {correctIndices.length} {t.correctAnswer}
              </span>
            )}
          </div>

          {!isSubmissionCorrect && isMultiple && (
            <p className="text-[11px] text-slate-300/90 font-normal">
              {t.multipleChoiceReqAllNotice}
            </p>
          )}

          {question.explanation && (
            <div className="pt-2 border-t border-slate-700/50">
              <p className="text-slate-300">
                <span className="font-semibold text-slate-200">{t.explanation}:</span>{' '}
                {question.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
