import React, { useState } from 'react';
import { CheckCircle2, XCircle, Check, X } from 'lucide-react';
import { Question, TrueFalsePayload, Submission } from '../../types/game';
import { translations } from '../../locales/translations';
import { sound } from '../../services/sound';

interface Props {
  question: Question;
  existingSubmission?: Submission;
  lang: 'el' | 'en';
  onSubmit: (data: { selectedValue: boolean; isCorrect: boolean; points: number }) => void;
  readOnly?: boolean;
}

export const TrueFalseQuest: React.FC<Props> = ({
  question,
  existingSubmission,
  lang,
  onSubmit,
  readOnly = false
}) => {
  const t = translations[lang];
  const payload = question.payload as TrueFalsePayload;
  const [selectedValue, setSelectedValue] = useState<boolean | null>(
    existingSubmission ? existingSubmission.answerData?.selectedValue : null
  );
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(!!existingSubmission);

  const handleSubmit = (val: boolean) => {
    if (readOnly || hasSubmitted) return;
    setSelectedValue(val);
    setHasSubmitted(true);
    const isCorrect = val === payload.correctValue;
    if (isCorrect) {
      sound.playSuccess();
    } else {
      sound.playError();
    }
    onSubmit({
      selectedValue: val,
      isCorrect,
      points: isCorrect ? question.points : 0
    });
  };

  return (
    <div className="space-y-4">
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

      <p className="text-sm text-slate-300 leading-relaxed font-normal">
        {question.description}
      </p>

      <div className="grid grid-cols-2 gap-3 pt-2">
        {/* TRUE BUTTON */}
        <button
          type="button"
          disabled={readOnly || hasSubmitted}
          onClick={() => handleSubmit(true)}
          className={`py-4 px-4 rounded-xl border font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
            hasSubmitted
              ? payload.correctValue === true
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50'
                : selectedValue === true
                ? 'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500/50'
                : 'bg-slate-900/40 border-slate-800 text-slate-600 opacity-50'
              : selectedValue === true
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-slate-800/80 hover:bg-emerald-950/40 border-slate-700 hover:border-emerald-500/50 text-slate-200'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
          <span>{t.trueOption}</span>
        </button>

        {/* FALSE BUTTON */}
        <button
          type="button"
          disabled={readOnly || hasSubmitted}
          onClick={() => handleSubmit(false)}
          className={`py-4 px-4 rounded-xl border font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
            hasSubmitted
              ? payload.correctValue === false
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50'
                : selectedValue === false
                ? 'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500/50'
                : 'bg-slate-900/40 border-slate-800 text-slate-600 opacity-50'
              : selectedValue === false
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-slate-800/80 hover:bg-rose-950/40 border-slate-700 hover:border-rose-500/50 text-slate-200'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <X className="w-6 h-6 stroke-[3]" />
          </div>
          <span>{t.falseOption}</span>
        </button>
      </div>

      {hasSubmitted && (
        <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
          selectedValue === payload.correctValue
            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
            : 'bg-rose-950/40 border-rose-800 text-rose-300'
        }`}>
          <div className="font-semibold flex items-center gap-1.5">
            {selectedValue === payload.correctValue ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.statusCorrect} (+{question.points} {t.pts})</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span>{t.statusIncorrect} (+0 {t.pts})</span>
              </>
            )}
          </div>
          {question.explanation && (
            <p className="text-slate-300 pt-1">{t.explanation}: {question.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
};
