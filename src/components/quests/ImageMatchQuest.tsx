import React, { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { Question, ImageMatchPayload, Submission } from '../../types/game';
import { translations } from '../../locales/translations';
import { sound } from '../../services/sound';

interface Props {
  question: Question;
  existingSubmission?: Submission;
  lang: 'el' | 'en';
  onSubmit: (data: { matchedPairs: Record<string, string>; isCorrect: boolean; points: number }) => void;
  readOnly?: boolean;
}

const PAIR_COLORS = [
  'border-amber-400 bg-amber-950/40 text-amber-300 ring-2 ring-amber-400',
  'border-cyan-400 bg-cyan-950/40 text-cyan-300 ring-2 ring-cyan-400',
  'border-emerald-400 bg-emerald-950/40 text-emerald-300 ring-2 ring-emerald-400',
  'border-purple-400 bg-purple-950/40 text-purple-300 ring-2 ring-purple-400',
  'border-pink-400 bg-pink-950/40 text-pink-300 ring-2 ring-pink-400'
];

export const ImageMatchQuest: React.FC<Props> = ({
  question,
  existingSubmission,
  lang,
  onSubmit,
  readOnly = false
}) => {
  const t = translations[lang];
  const payload = question.payload as ImageMatchPayload;

  const shuffledTextItems = useMemo(() => {
    const list = payload.pairs.map(p => ({ id: p.id, text: p.text }));
    return [...list].sort((a, b) => b.text.localeCompare(a.text));
  }, [payload.pairs]);

  const [matches, setMatches] = useState<Record<string, string>>(
    existingSubmission ? existingSubmission.answerData?.matchedPairs || {} : {}
  );
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(!!existingSubmission);

  const pairColorIndexMap = useMemo(() => {
    const map: Record<string, number> = {};
    payload.pairs.forEach((p, idx) => {
      map[p.id] = idx % PAIR_COLORS.length;
    });
    return map;
  }, [payload.pairs]);

  const handleSelectImage = (imgId: string) => {
    if (readOnly || hasSubmitted) return;
    if (selectedImageId === imgId) {
      setSelectedImageId(null);
    } else {
      setSelectedImageId(imgId);
    }
  };

  const handleSelectText = (textId: string) => {
    if (readOnly || hasSubmitted) return;
    if (!selectedImageId) return;

    sound.playSnap();
    setMatches(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (next[k] === textId) delete next[k];
      });
      next[selectedImageId] = textId;
      return next;
    });
    setSelectedImageId(null);
  };

  const handleUnpair = (imgId: string) => {
    if (readOnly || hasSubmitted) return;
    setMatches(prev => {
      const next = { ...prev };
      delete next[imgId];
      return next;
    });
  };

  const isAllMatched = payload.pairs.every(p => matches[p.id]);

  const handleSubmit = () => {
    if (readOnly || hasSubmitted || !isAllMatched) return;

    let correctCount = 0;
    payload.pairs.forEach(p => {
      if (matches[p.id] === p.id) {
        correctCount++;
      }
    });

    const isAllCorrect = correctCount === payload.pairs.length;
    const earnedPoints = Math.round((correctCount / payload.pairs.length) * question.points);

    if (isAllCorrect) {
      sound.playSuccess();
    } else {
      sound.playError();
    }

    setHasSubmitted(true);
    onSubmit({
      matchedPairs: matches,
      isCorrect: isAllCorrect,
      points: earnedPoints
    });
  };

  const handleReset = () => {
    if (readOnly || hasSubmitted) return;
    setMatches({});
    setSelectedImageId(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-300 leading-relaxed font-normal">
        {t.matchInstructionsImage}
      </p>

      {!hasSubmitted && !readOnly && (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{selectedImageId ? t.selectRightToPair : t.selectLeftFirst}</span>
          {Object.keys(matches).length > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.resetPairs}</span>
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Left Column: Image Tiles */}
        <div className="space-y-2.5">
          {payload.pairs.map((pair) => {
            const isSelected = selectedImageId === pair.id;
            const pairedTextId = matches[pair.id];
            const colorClass = pairedTextId !== undefined ? PAIR_COLORS[pairColorIndexMap[pair.id]] : '';

            let cardStyle = 'border-slate-700 bg-slate-800/80 hover:border-slate-600';
            if (hasSubmitted) {
              const isCorrect = pairedTextId === pair.id;
              cardStyle = isCorrect
                ? 'border-emerald-500 bg-emerald-950/60 ring-2 ring-emerald-500'
                : 'border-rose-500 bg-rose-950/60 ring-2 ring-rose-500';
            } else if (pairedTextId) {
              cardStyle = colorClass;
            } else if (isSelected) {
              cardStyle = 'border-amber-400 bg-amber-950/50 ring-2 ring-amber-400';
            }

            return (
              <button
                key={pair.id}
                type="button"
                disabled={readOnly || hasSubmitted}
                onClick={() => handleSelectImage(pair.id)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 ${cardStyle}`}
              >
                <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-950 border border-slate-700 flex items-center justify-center">
                  <img
                    src={pair.image}
                    alt="Match item"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-400 font-medium block">
                    {pairedTextId ? '✓ ' + t.matchedPairsCount : '—'}
                  </span>
                </div>
                {pairedTextId && !hasSubmitted && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnpair(pair.id);
                    }}
                    className="text-xs font-bold px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-rose-400"
                  >
                    ×
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Column: Descriptions */}
        <div className="space-y-2.5">
          {shuffledTextItems.map((item) => {
            const matchedImgId = Object.keys(matches).find(k => matches[k] === item.id);
            const colorClass = matchedImgId ? PAIR_COLORS[pairColorIndexMap[matchedImgId]] : '';

            let cardStyle = 'border-slate-700 bg-slate-800/80 text-slate-200 hover:border-slate-600';
            if (hasSubmitted) {
              const isCorrect = matchedImgId === item.id;
              cardStyle = isCorrect
                ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200 ring-2 ring-emerald-500'
                : 'border-rose-500 bg-rose-950/60 text-rose-200 ring-2 ring-rose-500';
            } else if (matchedImgId) {
              cardStyle = colorClass;
            } else if (selectedImageId) {
              cardStyle = 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-amber-400 cursor-pointer';
            }

            return (
              <button
                key={item.id}
                type="button"
                disabled={readOnly || hasSubmitted}
                onClick={() => handleSelectText(item.id)}
                className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all min-h-[58px] flex items-center ${cardStyle}`}
              >
                <span className="leading-snug">{item.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {!hasSubmitted && !readOnly && (
        <button
          type="button"
          disabled={!isAllMatched}
          onClick={handleSubmit}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all ${
            isAllMatched
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {t.submitAnswer} ({Object.keys(matches).length}/{payload.pairs.length})
        </button>
      )}

      {hasSubmitted && (
        <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
          Object.keys(matches).every(k => matches[k] === k)
            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
            : 'bg-rose-950/40 border-rose-800 text-rose-300'
        }`}>
          <div className="font-semibold flex items-center gap-1.5">
            {Object.keys(matches).every(k => matches[k] === k) ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.allMatchedSuccess} (+{question.points} {t.pts})</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span>{t.somePairsIncorrect} (+{existingSubmission?.scoreEarned || 0} {t.pts})</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
