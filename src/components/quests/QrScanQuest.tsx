import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, CheckCircle2, KeyRound, AlertCircle, Sparkles, QrCode } from 'lucide-react';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import { Question, QrScanPayload, QrScanMedia, Submission } from '../../types/game';
import { translations } from '../../locales/translations';
import { sound } from '../../services/sound';
import { UnlockedMediaViewer } from '../UnlockedMediaViewer';

interface Props {
  question: Question;
  existingSubmission?: Submission;
  lang: 'el' | 'en';
  onSubmit: (data: { decodedCode: string; isCorrect: boolean; points: number }) => void;
  onClose?: () => void;
  readOnly?: boolean;
}

export const QrScanQuest: React.FC<Props> = ({
  question,
  existingSubmission,
  lang,
  onSubmit,
  onClose,
  readOnly = false
}) => {
  const t = translations[lang];
  const payload = question.payload as QrScanPayload;

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(!!existingSubmission);
  const [justUnlocked, setJustUnlocked] = useState<boolean>(false);
  const [scannedCode, setScannedCode] = useState<string | null>(
    existingSubmission ? existingSubmission.answerData?.decodedCode : null
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Identify unlocked media (from unlockedMedia, unlockedImageUrl/VideoUrl, or question.imageUrl fallback)
  const unlockedMedia: QrScanMedia | null = payload.unlockedMedia || (
    payload.unlockedImageUrl ? { type: 'image', url: payload.unlockedImageUrl, title: question.title } :
    payload.unlockedVideoUrl ? { type: 'video', url: payload.unlockedVideoUrl, title: question.title } :
    question.imageUrl ? { type: 'image', url: question.imageUrl, title: question.title } :
    null
  );

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleSuccessfulCode = (code: string) => {
    stopCamera();
    setErrorMessage(null);

    const cleanInput = code.trim().toUpperCase();
    const cleanTarget = payload.targetCode.trim().toUpperCase();
    const isCorrect = cleanInput === cleanTarget;

    if (isCorrect) {
      setScannedCode(code);
      setHasSubmitted(true);
      setJustUnlocked(true);
      sound.playSuccess();
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 }
        });
      } catch {
        // Ignore if confetti fails
      }

      onSubmit({
        decodedCode: code,
        isCorrect: true,
        points: question.points
      });
    } else {
      sound.playError();
      setErrorMessage(t.qrInvalid);
    }
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        handleSuccessfulCode(code.data);
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const startCamera = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
    } catch {
      setErrorMessage(t.cameraPermissionDenied);
      setIsCameraActive(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleSuccessfulCode(code.data);
          } else {
            setErrorMessage(t.qrInvalid);
            sound.playError();
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleSuccessfulCode(manualCode);
  };

  return (
    <div className="space-y-4">
      {/* Question Description */}
      <p className="text-sm text-slate-300 leading-relaxed font-normal">
        {question.description || t.qrScanInstructions}
      </p>

      {/* Location Hint Card */}
      {payload.locationHint && (
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 text-xs text-amber-300 flex items-center gap-2">
          <KeyRound className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{payload.locationHint}</span>
        </div>
      )}

      {/* Secret Media Teaser when locked */}
      {!hasSubmitted && unlockedMedia && (
        <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/50 flex items-center gap-2.5 text-xs text-purple-200">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
          <span>
            {unlockedMedia.type === 'video'
              ? (lang === 'el'
                  ? '🔒 Σκανάρετε το QR Code του σταθμού για να ξεκλειδώσετε το μυστικό βίντεο!'
                  : '🔒 Scan the station QR Code to unlock the secret video!')
              : (lang === 'el'
                  ? '🔒 Σκανάρετε το QR Code του σταθμού για να ξεκλειδώσετε τη μυστική φωτογραφία!'
                  : '🔒 Scan the station QR Code to unlock the secret photo!')}
          </span>
        </div>
      )}

      {/* Camera Live Viewfinder */}
      {isCameraActive && (
        <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500 bg-black aspect-video flex items-center justify-center shadow-2xl">
          <video ref={videoRef} className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanner Overlay Box */}
          <div className="absolute inset-0 border-4 border-amber-400/40 pointer-events-none flex flex-col items-center justify-center gap-2">
            <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-dashed border-amber-400 rounded-2xl animate-pulse flex items-center justify-center bg-amber-500/5" />
            <span className="px-3 py-1 rounded-full bg-black/70 text-amber-300 font-mono text-[11px] font-semibold border border-amber-500/30">
              {lang === 'el' ? 'Στρέψτε την κάμερα στο QR Code' : 'Point camera at QR Code'}
            </span>
          </div>

          <button
            type="button"
            onClick={stopCamera}
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 transition-colors shadow-lg"
          >
            {t.stopCamera}
          </button>
        </div>
      )}

      {/* Scan & Upload Action Buttons (when not solved and camera inactive) */}
      {!hasSubmitted && !readOnly && !isCameraActive && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={startCamera}
            className="py-3 px-4 rounded-xl border border-amber-500/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Camera className="w-4 h-4 text-amber-400" />
            <span>{t.startCamera}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition-all hover:border-slate-600 active:scale-95"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>{t.uploadQrImage}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      )}

      {/* Manual Passcode Entry Form */}
      {!hasSubmitted && !readOnly && !isCameraActive && (
        <form onSubmit={handleManualSubmit} className="pt-2">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            {t.orEnterCode}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder={t.enterCodePlaceholder}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 uppercase tracking-wider font-mono"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shadow-md"
            >
              {t.verifyCodeBtn}
            </button>
          </div>
        </form>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ================= UNLOCKED CONTENT SECTION ================= */}
      {hasSubmitted && (
        <div className="space-y-4 pt-2">
          {/* Success Banner */}
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs leading-relaxed space-y-1">
            <div className="font-semibold flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{t.qrTargetFound} (+{question.points} {t.pts})</span>
              </div>
              {justUnlocked && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase animate-pulse">
                  {lang === 'el' ? 'Μόλις Ξεκλειδώθηκε!' : 'Just Unlocked!'}
                </span>
              )}
            </div>
            <p className="text-slate-400 pt-1 font-mono text-[11px]">
              {t.yourAnswer}: <span className="text-slate-200 font-semibold">{scannedCode || payload.targetCode}</span>
            </p>
          </div>

          {/* Unlocked Photo or Video Viewer */}
          {unlockedMedia ? (
            <UnlockedMediaViewer media={unlockedMedia} lang={lang} />
          ) : (
            question.explanation && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <span className="font-semibold text-slate-200">{t.explanation}:</span> {question.explanation}
              </div>
            )
          )}

          {/* Action button to return to quests after viewing media */}
          {onClose && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>{lang === 'el' ? '✓ Ολοκλήρωση & Επιστροφή στις Αποστολές' : '✓ Done & Return to Quests'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
