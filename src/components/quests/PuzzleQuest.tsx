import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Shuffle, Eye, EyeOff, Upload, CheckCircle2, RotateCcw, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question, PuzzlePayload, Submission } from '../../types/game';
import { translations } from '../../locales/translations';
import { sound } from '../../services/sound';

interface Props {
  question: Question;
  existingSubmission?: Submission;
  lang: 'el' | 'en';
  onSubmit: (data: { moves: number; durationSeconds: number; points: number; gridPieces: number }) => void;
  readOnly?: boolean;
}

export const PuzzleQuest: React.FC<Props> = ({
  question,
  existingSubmission,
  lang,
  onSubmit,
  readOnly = false
}) => {
  const t = translations[lang];
  const payload = question.payload as PuzzlePayload;

  const [gridSize, setGridSize] = useState<4 | 6 | 9>(payload.gridPieces || 6);
  const [activeImage, setActiveImage] = useState<string>(question.imageUrl || payload.imageUrl);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [moves, setMoves] = useState<number>(existingSubmission?.puzzleStats?.moves || 0);
  const [hasSolved, setHasSolved] = useState<boolean>(!!existingSubmission);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(
    existingSubmission?.puzzleStats?.durationSeconds || 0
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Compute rows and cols:
  // 4 pieces: 2 cols x 2 rows
  // 6 pieces: 3 cols x 2 rows
  // 9 pieces: 3 cols x 3 rows
  const { cols, rows, totalPieces } = useMemo(() => {
    if (gridSize === 4) return { cols: 2, rows: 2, totalPieces: 4 };
    if (gridSize === 6) return { cols: 3, rows: 2, totalPieces: 6 };
    return { cols: 3, rows: 3, totalPieces: 9 };
  }, [gridSize]);

  // Pieces array: array of length totalPieces, where pieces[slotIndex] = originalPieceIndex
  const [pieces, setPieces] = useState<number[]>(() => {
    if (existingSubmission) {
      return Array.from({ length: totalPieces }, (_, i) => i);
    }
    // Shuffle pieces so it is not solved
    const arr = Array.from({ length: totalPieces }, (_, i) => i);
    let shuffled = [...arr].sort(() => Math.random() - 0.5);
    // Ensure not already solved by chance
    while (shuffled.every((val, idx) => val === idx)) {
      shuffled = [...arr].sort(() => Math.random() - 0.5);
    }
    return shuffled;
  });

  // Re-shuffle when grid size changes
  const initShuffle = (count: number) => {
    const arr = Array.from({ length: count }, (_, i) => i);
    let shuffled = [...arr].sort(() => Math.random() - 0.5);
    while (shuffled.every((val, idx) => val === idx)) {
      shuffled = [...arr].sort(() => Math.random() - 0.5);
    }
    setPieces(shuffled);
    setSelectedPieceIndex(null);
    setMoves(0);
    setHasSolved(false);
    setStartTime(Date.now());
  };

  const handleGridChange = (newSize: 4 | 6 | 9) => {
    if (readOnly || hasSolved) return;
    setGridSize(newSize);
    const count = newSize;
    initShuffle(count);
  };

  // Timer loop when not solved
  useEffect(() => {
    if (hasSolved || readOnly) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [hasSolved, startTime, readOnly]);

  const swapPieces = (indexA: number, indexB: number) => {
    if (indexA === indexB || readOnly || hasSolved) return;

    sound.playSnap();
    const newPieces = [...pieces];
    const temp = newPieces[indexA];
    newPieces[indexA] = newPieces[indexB];
    newPieces[indexB] = temp;

    setPieces(newPieces);
    setMoves(prev => prev + 1);
    setSelectedPieceIndex(null);

    // Check if solved!
    const isSolved = newPieces.every((pieceId, idx) => pieceId === idx);
    if (isSolved) {
      setHasSolved(true);
      sound.playFanfare();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
      onSubmit({
        moves: moves + 1,
        durationSeconds: duration,
        points: question.points,
        gridPieces: gridSize
      });
    }
  };

  const handlePieceClick = (slotIndex: number) => {
    if (readOnly || hasSolved) return;

    if (selectedPieceIndex === null) {
      setSelectedPieceIndex(slotIndex);
    } else {
      swapPieces(selectedPieceIndex, slotIndex);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (slotIndex: number) => {
    if (readOnly || hasSolved) return;
    setDraggedIndex(slotIndex);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetSlotIndex: number) => {
    if (draggedIndex === null || readOnly || hasSolved) return;
    swapPieces(draggedIndex, targetSlotIndex);
    setDraggedIndex(null);
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setActiveImage(result);
      initShuffle(gridSize);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-300 leading-relaxed font-normal">
        {t.puzzleInstructions}
      </p>

      {/* Grid Size Selector & Image options */}
      {!hasSolved && !readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium mr-1">{t.gridPieces6.split(' ')[0]}:</span>
            {([4, 6, 9] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => handleGridChange(size)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  gridSize === size
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOriginal(!showOriginal)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              {showOriginal ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{showOriginal ? t.hideOriginal : t.showOriginal}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              title={t.uploadCustomPuzzleImg}
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCustomImageUpload}
            />

            <button
              type="button"
              onClick={() => initShuffle(gridSize)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              title={t.shufflePuzzle}
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
        <div>
          <span>{t.movesCount}: </span>
          <span className="font-bold text-slate-200">{moves}</span>
        </div>
        <div>
          <span>{t.timeElapsed}: </span>
          <span className="font-bold text-slate-200">{elapsedSeconds}s</span>
        </div>
      </div>

      {/* Original Image Preview Drawer */}
      {showOriginal && (
        <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2 flex flex-col items-center">
          <span className="text-[11px] text-amber-400 font-medium mb-1.5">{t.showOriginal}</span>
          <img
            src={activeImage}
            alt="Original reference"
            className="w-full max-h-48 object-contain rounded-lg"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Interactive Puzzle Grid Canvas */}
      <div
        className="relative mx-auto rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-950 p-1 select-none shadow-2xl max-w-md aspect-video"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          gap: '4px'
        }}
      >
        {pieces.map((originalIndex, slotIndex) => {
          // Calculate source background position for this original piece
          const origCol = originalIndex % cols;
          const origRow = Math.floor(originalIndex / cols);
          const xPercent = cols > 1 ? (origCol / (cols - 1)) * 100 : 0;
          const yPercent = rows > 1 ? (origRow / (rows - 1)) * 100 : 0;

          const isSelected = selectedPieceIndex === slotIndex;
          const isCorrect = originalIndex === slotIndex;

          return (
            <div
              key={slotIndex}
              draggable={!readOnly && !hasSolved}
              onDragStart={() => handleDragStart(slotIndex)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(slotIndex)}
              onClick={() => handlePieceClick(slotIndex)}
              className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-150 ${
                isSelected
                  ? 'ring-4 ring-amber-400 scale-[0.98] z-10 shadow-lg'
                  : hasSolved
                  ? 'ring-1 ring-emerald-500/50'
                  : 'hover:opacity-95 hover:brightness-110 active:scale-95'
              }`}
              style={{
                backgroundImage: `url(${activeImage})`,
                backgroundSize: `${cols * 100}% ${rows * 100}%`,
                backgroundPosition: `${xPercent}% ${yPercent}%`,
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* Subtle slot indicator */}
              {!hasSolved && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] font-mono text-white/80 pointer-events-none">
                  {slotIndex + 1}
                </div>
              )}
              {isCorrect && !hasSolved && (
                <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-950 pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      {/* Completion Banner */}
      {hasSolved && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs leading-relaxed space-y-1.5 animate-fadeIn">
          <div className="font-semibold flex items-center gap-2 text-sm">
            <Award className="w-5 h-5 text-amber-400" />
            <span>{t.puzzleSolvedBravo} (+{question.points} {t.pts})</span>
          </div>
          <p className="text-slate-300">
            {t.movesCount}: <span className="font-bold text-emerald-400">{moves}</span> · {t.timeElapsed}: <span className="font-bold text-emerald-400">{elapsedSeconds}s</span> · {gridSize} {t.gridPieces6.split(' ')[1]}
          </p>
        </div>
      )}
    </div>
  );
};
