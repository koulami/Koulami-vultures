import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Camera,
  Upload,
  RefreshCw,
  Award,
  ListChecks,
  FileText,
  AlertCircle,
  Sparkles,
  Target
} from 'lucide-react';
import { Question, TaskPayload, Submission } from '../../types/game';
import { translations } from '../../locales/translations';
import { sound } from '../../services/sound';

interface Props {
  question: Question;
  existingSubmission?: Submission;
  lang: 'el' | 'en';
  onSubmit: (data: {
    points: number;
    checklistCompleted: boolean[];
    reportText?: string;
    photoUrl?: string;
  }) => void;
  readOnly?: boolean;
}

export const TaskQuest: React.FC<Props> = ({
  question,
  existingSubmission,
  lang,
  onSubmit,
  readOnly = false
}) => {
  const t = translations[lang];
  const payload = (question.payload || {}) as TaskPayload;

  const checklistItems = payload.checklist || [];
  const requiresEvidence = payload.requiresEvidence || 'text';

  // State for checklist
  const initialChecked = checklistItems.map((_, idx) => {
    if (existingSubmission?.answerData?.checklistCompleted) {
      return !!existingSubmission.answerData.checklistCompleted[idx];
    }
    return false;
  });

  const [checkedState, setCheckedState] = useState<boolean[]>(initialChecked);

  // State for text report
  const [reportText, setReportText] = useState<string>(
    existingSubmission?.answerData?.reportText || existingSubmission?.answerData?.caption || ''
  );

  // State for photo
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    existingSubmission?.photoUrl || existingSubmission?.answerData?.photoUrl || null
  );

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isCompleted = !!existingSubmission;

  const stopCamera = () => {
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

  const handleToggleCheck = (index: number) => {
    if (readOnly || isCompleted) return;
    const next = [...checkedState];
    next[index] = !next[index];
    setCheckedState(next);
    sound.click();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      setErrorMessage(null);
    } catch {
      setErrorMessage(t.cameraPermissionDenied);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhotoUrl(dataUrl);
      stopCamera();
      sound.success();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setPhotoUrl(reader.result as string);
          sound.success();
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const allChecklistDone =
    checklistItems.length === 0 || checkedState.every((val) => val === true);

  const canSubmit = () => {
    if (readOnly || isCompleted) return false;
    if (!allChecklistDone) return false;

    if (requiresEvidence === 'text' || requiresEvidence === 'both') {
      if (!reportText.trim()) return false;
    }

    if (requiresEvidence === 'photo' || requiresEvidence === 'both') {
      if (!photoUrl) return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!allChecklistDone) {
      setErrorMessage(t.taskIncompleteChecklistWarn);
      sound.incorrect();
      return;
    }

    if ((requiresEvidence === 'text' || requiresEvidence === 'both') && !reportText.trim()) {
      setErrorMessage(lang === 'el' ? 'Παρακαλούμε συμπληρώστε την αναφορά της ομάδας σας.' : 'Please enter your team findings.');
      sound.incorrect();
      return;
    }

    if ((requiresEvidence === 'photo' || requiresEvidence === 'both') && !photoUrl) {
      setErrorMessage(lang === 'el' ? 'Παρακαλούμε προσθέστε μία φωτογραφία τεκμηρίωσης.' : 'Please attach a photo proof.');
      sound.incorrect();
      return;
    }

    sound.success();
    onSubmit({
      points: question.points,
      checklistCompleted: checkedState,
      reportText: reportText.trim() || undefined,
      photoUrl: photoUrl || undefined
    });
  };

  const completedStepsCount = checkedState.filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Question Description / Instructions */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
          <Target className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{t.taskInstructions}</span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
          {question.description}
        </p>
        {payload.instructions && payload.instructions !== question.description && (
          <p className="text-xs text-slate-300 leading-relaxed pt-1.5 border-t border-slate-800/80">
            {payload.instructions}
          </p>
        )}
      </div>

      {/* Optional reference photo on quest card */}
      {question.imageUrl && (
        <div className="rounded-xl overflow-hidden border border-slate-800 max-h-56 bg-slate-950 flex items-center justify-center">
          <img
            src={question.imageUrl}
            alt={question.title}
            className="w-full h-auto max-h-56 object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* 1. Checklist Section */}
      {checklistItems.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">
                {t.taskChecklistTitle}
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-amber-400">
              {completedStepsCount} / {checklistItems.length}
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            {t.taskChecklistSubtext}
          </p>

          {/* Progress bar */}
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{
                width: `${(completedStepsCount / checklistItems.length) * 100}%`
              }}
            />
          </div>

          <div className="space-y-2 pt-1">
            {checklistItems.map((step, idx) => {
              const checked = checkedState[idx];
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={readOnly || isCompleted}
                  onClick={() => handleToggleCheck(idx)}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    checked
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-slate-100 shadow-xs'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  } ${readOnly || isCompleted ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="shrink-0 mt-0.5">
                    {checked ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-xs block leading-relaxed ${
                        checked ? 'line-through text-emerald-300/80 font-medium' : ''
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Written Report Section */}
      {(requiresEvidence === 'text' || requiresEvidence === 'both') && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <label className="text-xs font-bold text-slate-200">
              {payload.completionPrompt || t.taskReportLabel}
            </label>
          </div>

          {isCompleted || readOnly ? (
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 whitespace-pre-line">
              {reportText || (lang === 'el' ? '— Καμία αναφορά —' : '— No report entered —')}
            </div>
          ) : (
            <textarea
              rows={3}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder={t.taskReportPlaceholder}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          )}
        </div>
      )}

      {/* 3. Photo Evidence Section */}
      {(requiresEvidence === 'photo' || requiresEvidence === 'both') && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-rose-400" />
            <label className="text-xs font-bold text-slate-200">
              {t.taskUploadPhotoLabel}
            </label>
          </div>

          {photoUrl ? (
            <div className="space-y-2">
              <div className="rounded-xl overflow-hidden border border-slate-800 max-h-60 bg-slate-900 flex items-center justify-center">
                <img
                  src={photoUrl}
                  alt="Team mission evidence"
                  className="w-full h-auto max-h-60 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {!isCompleted && !readOnly && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{lang === 'el' ? 'Αλλαγή φωτογραφίας' : 'Change photo'}</span>
                </button>
              )}
            </div>
          ) : isCameraActive ? (
            <div className="space-y-2">
              <div className="rounded-xl overflow-hidden bg-black border border-slate-800 aspect-video relative flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>{lang === 'el' ? 'Λήψη Φωτογραφίας' : 'Take Photo'}</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          ) : !isCompleted && !readOnly ? (
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={startCamera}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>{t.startCamera}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>{t.choosePhoto}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              {lang === 'el' ? 'Δεν επισυνάφθηκε φωτογραφία' : 'No photo attached'}
            </p>
          )}
        </div>
      )}

      {/* Error message banner */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Completed State Display */}
      {isCompleted ? (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 space-y-2 text-center">
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>{t.taskConfirmedDone}</span>
          </div>
          <span className="text-xs text-emerald-300/90 font-mono font-bold block">
            +{existingSubmission.scoreEarned} {t.pts}
          </span>
        </div>
      ) : (
        /* Action Submit Button */
        !readOnly && (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit()}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                canSubmit()
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>{t.taskCompleteBtn}</span>
              <span className="font-mono ml-1 px-1.5 py-0.5 rounded bg-slate-950/20 text-slate-950 text-[10px]">
                +{question.points} {t.pts}
              </span>
            </button>
          </div>
        )
      )}
    </div>
  );
};
