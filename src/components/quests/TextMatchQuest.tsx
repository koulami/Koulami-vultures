import React, { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { Question, TextMatchPayload, Submission } from '../../types/game';
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
  'border-amber-400 bg-amber-950/40 text-amber-300 ring-1 ring-amber-400/50',
  'border-cyan-400 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-400/50',
  'border-emerald-400 bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-400/50',
  'border-purple-400 bg-purple-950/40 text-purple-300 ring-1 ring-purple-400/50',
  'border-pink-400 bg-pink-950/40 text-pink-300 ring-1 ring-pink-400/50',
  'border-blue-400 bg-blue-950/40 text-blue-300 ring-1 ring-blue-400/50'
];

export const TextMatchQuest: React.FC<Props> = ({
  question,
  existingSubmission,
  lang,
  onSubmit,
  readOnly = false
}) => {
  const t = translations[lang];
  const payload = question.payload as TextMatchPayload;
  
  // Deterministic or stable shuffle for the right items
  const shuffledRight = useMemo(() => {
    const rights = payload.pairs.map(p => ({ id: p.id, text: p.right }));
    // Simple pseudo-random shuffle based on question id
    return [...rights].sort((a, b) => b.text.localeCompare(a.text));
  }, [payload.pairs]);

  // key: pair.id (left item id), value: paired right item id
  const [matches, setMatches] = useState<Record<string, string>>(
    existingSubmission ? existingSubmission.answerData?.matchedPairs || {} : {}
  );
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(!!existingSubmission);

  // Pair color map
  const pairColorIndexMap = useMemo(() => {
    const map: Record<string, number> = {};
    payload.pairs.forEach((p, idx) => {
      map[p.id] = idx % PAIR_COLORS.length;
    });
    return map;
  }, [payload.pairs]);

  const handleSelectLeft = (leftId: string) => {
    if (readOnly || hasSubmitted) return;
    if (selectedLeft === leftId) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(leftId);
    }
  };

  const handleSelectRight = (rightId: string) => {
    if (readOnly || hasSubmitted) return;
    if (!selectedLeft) return;

    sound.playSnap();
    setMatches(prev => {
      const next = { ...prev };
      // Remove any other left pointing to this right
      Object.keys(next).forEach(k => {
        if (next[k] === rightId) delete next[k];
      });
      next[selectedLeft] = rightId;
      return next;
    });
    setSelectedLeft(null);
  };

  const handleUnpair = (leftId: string) => {
    if (readOnly || hasSubmitted) return;
    setMatches(prev => {
      const next = { ...prev };
      delete next[leftId];
      return next;
    });
  };

  const isAllMatched = payload.pairs.every(p => matches[p.id]);

  const handleSubmit = () => {
    if (readOnly || hasSubmitted || !isAllMatched) return;

    // Check correctness: left item id must match the right item id of the original pair
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
    setSelectedLeft(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-300 leading-relaxed font-normal">
        {t.matchInstructionsText}
      </p>

      {!hasSubmitted && !readOnly && (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{selectedLeft ? t.selectRightToPair : t.selectLeftFirst}</span>
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

      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Left Column */}
        <div className="space-y-2">
          {payload.pairs.map((pair) => {
            const isSelected = selectedLeft === pair.id;
            const pairedRightId = matches[pair.id];
            const colorClass = pairedRightId !== undefined ? PAIR_COLORS[pairColorIndexMap[pair.id]] : '';

            let cardStyle = 'border-slate-700 bg-slate-800/80 text-slate-200 hover:border-slate-600';
            if (hasSubmitted) {
              const isCorrect = pairedRightId === pair.id;
              cardStyle = isCorrect
                ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200'
                : 'border-rose-500 bg-rose-950/60 text-rose-200';
            } else if (pairedRightId) {
              cardStyle = colorClass;
            } else if (isSelected) {
              cardStyle = 'border-amber-400 bg-amber-950/50 text-amber-200 ring-2 ring-amber-400';
            }

            return (
              <button
                key={pair.id}
                type="button"
                disabled={readOnly || hasSubmitted}
                onClick={() => handleSelectLeft(pair.id)}
                className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between min-h-[50px] ${cardStyle}`}
              >
                <span className="leading-snug">{pair.left}</span>
                {pairedRightId && !hasSubmitted && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnpair(pair.id);
                    }}
                    className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 hover:text-rose-400 ml-1 shrink-0"
                  >
                    ×
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Column */}
        <div className="space-y-2">
          {shuffledRight.map((rItem) => {
            // Find which left is currently paired with this right
            const matchedLeftId = Object.keys(matches).find(k => matches[k] === rItem.id);
            const colorClass = matchedLeftId ? PAIR_COLORS[pairColorIndexMap[matchedLeftId]] : '';

            let cardStyle = 'border-slate-700 bg-slate-800/80 text-slate-200 hover:border-slate-600';
            if (hasSubmitted) {
              const isCorrect = matchedLeftId === rItem.id;
              cardStyle = isCorrect
                ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200'
                : 'border-rose-500 bg-rose-950/60 text-rose-200';
            } else if (matchedLeftId) {
              cardStyle = colorClass;
            } else if (selectedLeft) {
              cardStyle = 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-amber-400/80 cursor-pointer';
            }

            return (
              <button
                key={rItem.id}
                type="button"
                disabled={readOnly || hasSubmitted}
                onClick={() => handleSelectRight(rItem.id)}
                className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between min-h-[50px] ${cardStyle}`}
              >
                <span className="leading-snug">{rItem.text}</span>
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
