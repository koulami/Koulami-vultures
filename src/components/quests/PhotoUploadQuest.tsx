import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, CheckCircle2, RefreshCw } from 'lucide-react';
import { Question, PhotoUploadPayload, Submission } from '../../types/game';
import { translations } from '../../locales/translations';
import { sound } from '../../services/sound';

interface Props {
  question: Question;
  existingSubmission?: Submission;
  lang: 'el' | 'en';
  onSubmit: (data: { photoUrl: string; caption?: string; points: number }) => void;
  readOnly?: boolean;
}

export const PhotoUploadQuest: React.FC<Props> = ({
  question,
  existingSubmission,
  lang,
  onSubmit,
  readOnly = false
}) => {
  const t = translations[lang];
  const payload = question.payload as PhotoUploadPayload;

  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(
    existingSubmission ? existingSubmission.photoUrl || existingSubmission.answerData?.photoUrl || null : null
  );
  const [caption, setCaption] = useState<string>(
    existingSubmission ? existingSubmission.answerData?.caption || '' : ''
  );
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(!!existingSubmission);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch {
      setIsCameraActive(false);
    }
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const maxDim = 800;
    let w = video.videoWidth || 640;
    let h = video.videoHeight || 480;
    if (w > maxDim || h > maxDim) {
      const ratio = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhotoDataUrl(dataUrl);
      sound.playSnap();
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawData = event.target?.result as string;
      if (!rawData) return;

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 900;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            setPhotoDataUrl(compressed);
          } else {
            setPhotoDataUrl(rawData);
          }
        } catch {
          setPhotoDataUrl(rawData);
        }
        sound.playSnap();
      };
      img.onerror = () => {
        setPhotoDataUrl(rawData);
        sound.playSnap();
      };
      img.src = rawData;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = () => {
    if (readOnly || hasSubmitted || !photoDataUrl) return;
    sound.playSuccess();
    setHasSubmitted(true);
    onSubmit({
      photoUrl: photoDataUrl,
      caption: caption.trim(),
      points: question.points
    });
  };

  const handleRetake = () => {
    if (readOnly || hasSubmitted) return;
    setPhotoDataUrl(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-300 leading-relaxed font-normal">
        {t.photoUploadInstructions}
      </p>

      {payload.instructions && (
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 text-xs text-amber-200">
          {payload.instructions}
        </div>
      )}

      {/* Live Camera View */}
      {isCameraActive && (
        <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-500 bg-black aspect-video flex items-center justify-center">
          <video ref={videoRef} className="w-full h-full object-cover" />
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={captureCameraPhoto}
              className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-colors flex items-center gap-2 shadow-lg"
            >
              <Camera className="w-4 h-4" />
              <span>{t.choosePhoto}</span>
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Photo Preview */}
      {photoDataUrl && !isCameraActive && (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center max-h-80">
            <img
              src={photoDataUrl}
              alt="Team upload preview"
              className="w-full h-auto max-h-80 object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
            {!hasSubmitted && !readOnly && (
              <button
                type="button"
                onClick={handleRetake}
                className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 backdrop-blur-sm transition-colors text-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t.retakePhoto}</span>
              </button>
            )}
          </div>

          {!hasSubmitted && !readOnly && (
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t.captionPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
            />
          )}
        </div>
      )}

      {/* Camera / Upload buttons when no photo is set */}
      {!photoDataUrl && !isCameraActive && !hasSubmitted && !readOnly && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={startCamera}
            className="py-4 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex flex-col items-center justify-center gap-2 transition-all hover:border-cyan-500/50"
          >
            <Camera className="w-5 h-5 text-cyan-400" />
            <span>{t.startCamera}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-4 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex flex-col items-center justify-center gap-2 transition-all hover:border-amber-500/50"
          >
            <Upload className="w-5 h-5 text-amber-400" />
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
      )}

      {/* Submit Button */}
      {photoDataUrl && !hasSubmitted && !readOnly && (
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all"
        >
          {t.submitAnswer} (+{question.points} {t.pts})
        </button>
      )}

      {/* Submitted Status */}
      {hasSubmitted && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs leading-relaxed space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>{t.photoUploadedSuccess} (+{question.points} {t.pts})</span>
          </div>
          {caption && (
            <p className="text-slate-300 italic pt-1">"{caption}"</p>
          )}
        </div>
      )}
    </div>
  );
};
