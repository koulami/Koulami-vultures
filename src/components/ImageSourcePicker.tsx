import React, { useState, useRef, useEffect } from 'react';
import { Upload, Globe, Image as ImageIcon, X, Check, AlertCircle, Camera, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { Language } from '../types/game';
import { SVG_IMAGES } from '../data/defaultGame';

interface Props {
  value?: string;
  onChange: (imageUrl: string) => void;
  onClear?: () => void;
  lang: Language;
  label?: string;
}

export const ImageSourcePicker: React.FC<Props> = ({
  value,
  onChange,
  onClear,
  lang,
  label
}) => {
  const [sourceTab, setSourceTab] = useState<'upload' | 'url' | 'presets' | 'camera'>('upload');
  const [urlInput, setUrlInput] = useState<string>('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [isTestingUrl, setIsTestingUrl] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const uniqueId = useRef(`file-input-${Math.random().toString(36).substring(2, 9)}`).current;

  const presets = [
    { id: 'parthenon', name: lang === 'el' ? 'Παρθενώνας' : 'Parthenon', url: SVG_IMAGES.parthenon },
    { id: 'treasureMap', name: lang === 'el' ? 'Χάρτης Θησαυρού' : 'Treasure Map', url: SVG_IMAGES.treasureMap },
    { id: 'telescope', name: lang === 'el' ? 'Τηλεσκόπιο' : 'Telescope', url: SVG_IMAGES.telescope },
    { id: 'microscope', name: lang === 'el' ? 'Μικροσκόπιο' : 'Microscope', url: SVG_IMAGES.microscope },
    { id: 'compass', name: lang === 'el' ? 'Πυξίδα' : 'Compass', url: SVG_IMAGES.compass },
    { id: 'chameleon', name: lang === 'el' ? 'Χαμαιλέοντας' : 'Chameleon', url: SVG_IMAGES.chameleon },
    { id: 'atom', name: lang === 'el' ? 'Μοντέλο Ατόμου' : 'Atom Model', url: SVG_IMAGES.atom },
    { id: 'temple', name: lang === 'el' ? 'Αρχαίος Ναός' : 'Ancient Temple', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80' },
    { id: 'olympia', name: lang === 'el' ? 'Ολυμπιακό Στάδιο' : 'Stadium', url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80' },
    { id: 'scroll', name: lang === 'el' ? 'Πάπυρος & Χάρτης' : 'Ancient Scroll', url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80' }
  ];

  // Camera cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch {
      try {
        const streamFallback = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = streamFallback;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          setIsCameraActive(true);
        }
      } catch (err: any) {
        setCameraError(
          lang === 'el'
            ? 'Δεν ήταν δυνατή η πρόσβαση στην κάμερα. Ελέγξτε τις άδειες του browser.'
            : 'Camera access denied or unavailable.'
        );
        setIsCameraActive(false);
      }
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const maxDim = 1000;
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        onChange(dataUrl);
        stopCamera();
      }
    } catch {
      stopCamera();
    }
  };

  const processFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      alert(lang === 'el' ? 'Παρακαλώ επιλέξτε ένα αρχείο εικόνας (PNG, JPG, WEBP κτλ)' : 'Please select an image file (PNG, JPG, WEBP etc)');
      return;
    }

    setIsProcessingFile(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        setIsProcessingFile(false);
        return;
      }

      // If SVG or small file, use raw data url directly
      if (file.type.includes('svg') || file.size < 400000) {
        onChange(rawDataUrl);
        setIsProcessingFile(false);
        return;
      }

      // Try image compression for larger photos
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
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
            const compressed = canvas.toDataURL('image/jpeg', 0.86);
            onChange(compressed);
          } else {
            onChange(rawDataUrl);
          }
        } catch {
          // Canvas compression failed, fallback to raw data url
          onChange(rawDataUrl);
        } finally {
          setIsProcessingFile(false);
        }
      };

      img.onerror = () => {
        // Fallback to raw data url directly
        onChange(rawDataUrl);
        setIsProcessingFile(false);
      };

      img.src = rawDataUrl;
    };

    reader.onerror = () => {
      setIsProcessingFile(false);
      alert(lang === 'el' ? 'Σφάλμα ανάγνωσης του αρχείου' : 'Error reading file');
    };

    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Always reset input so same file can be selected again
    e.target.value = '';
  };

  // Helper to extract clean direct URL if user pasted a Google Images or page link
  const cleanImageUrl = (raw: string): string => {
    let cleaned = raw.trim();
    if (!cleaned) return '';

    // Check if it's a Google Images search result link: ...imgurl=https%3A%2F%2F...
    try {
      if (cleaned.includes('google.') && cleaned.includes('imgurl=')) {
        const urlObj = new URL(cleaned);
        const imgurl = urlObj.searchParams.get('imgurl');
        if (imgurl) {
          cleaned = decodeURIComponent(imgurl);
        }
      }
    } catch {
      // ignore
    }

    return cleaned;
  };

  const handleApplyUrl = (force: boolean = false) => {
    const raw = urlInput.trim();
    if (!raw) return;

    const cleaned = cleanImageUrl(raw);
    setUrlError(null);

    // If starts with data: or force apply is requested
    if (cleaned.startsWith('data:image/') || force) {
      onChange(cleaned);
      setUrlInput('');
      return;
    }

    setIsTestingUrl(true);
    const testImg = new Image();
    testImg.referrerPolicy = 'no-referrer';

    testImg.onload = () => {
      setIsTestingUrl(false);
      onChange(cleaned);
      setUrlInput('');
    };

    testImg.onerror = () => {
      setIsTestingUrl(false);
      // Give warning but allow user to use it anyway
      setUrlError(
        lang === 'el'
          ? 'Η εικόνα ενδέχεται να έχει περιορισμούς προβολής (CORS/προστασία). Μπορείτε να δοκιμάσετε "Χρήση ούτως ή άλλως" ή να ανεβάσετε το αρχείο από τον υπολογιστή/κινητό σας.'
          : 'Image host may restrict hotlinking. You can click "Use Anyway" or upload directly from file.'
      );
    };

    testImg.src = cleaned;
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveImage = () => {
    onChange('');
    if (onClear) onClear();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-xs font-semibold text-slate-300">
          {label}
        </label>
      )}

      {/* 1. CURRENT IMAGE PREVIEW CARD (Visible when an image is chosen) */}
      {value ? (
        <div className="rounded-xl border border-amber-500/40 bg-slate-950 p-3 space-y-3 shadow-inner">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 flex items-center justify-center group shadow-md">
                <img
                  src={value}
                  alt="Selected"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.opacity = '0.5';
                  }}
                />
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{lang === 'el' ? 'Φωτογραφία Ενεργή' : 'Active Photo'}</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-[220px] sm:max-w-xs font-mono">
                  {value.startsWith('data:image/')
                    ? (lang === 'el' ? '📁 Τοπικό αρχείο εικόνας (Base64)' : '📁 Local image file')
                    : value}
                </p>
                <p className="text-[10px] text-amber-300/80">
                  {lang === 'el' ? 'Μπορείτε να ανεβάσετε άλλη ή να διαλέξετε νέα παρακάτω.' : 'You can replace it with another photo below.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRemoveImage}
                className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                title={lang === 'el' ? 'Αφαίρεση φωτογραφίας' : 'Remove photo'}
              >
                <X className="w-4 h-4" />
                <span>{lang === 'el' ? 'Αφαίρεση' : 'Remove'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-slate-500 shrink-0" />
          <span>{lang === 'el' ? 'Δεν έχει επιλεγεί φωτογραφία. Επιλέξτε τρόπο εισαγωγής:' : 'No photo selected. Choose an input method below:'}</span>
        </div>
      )}

      {/* 2. SOURCE SELECTOR TABS & CONTROLS (ALWAYS AVAILABLE!) */}
      <div className="space-y-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
          <span>{value ? (lang === 'el' ? 'Αλλαγή / Επιλογή Νέας Φωτογραφίας:' : 'Change / Upload New Photo:') : (lang === 'el' ? 'Τρόπος Εισαγωγής Φωτογραφίας:' : 'Photo Input Method:')}</span>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setSourceTab('upload');
              stopCamera();
            }}
            className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              sourceTab === 'upload'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{lang === 'el' ? 'Αρχείο' : 'File'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSourceTab('url');
              stopCamera();
            }}
            className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              sourceTab === 'url'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{lang === 'el' ? 'Web URL' : 'URL'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSourceTab('presets');
              stopCamera();
            }}
            className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              sourceTab === 'presets'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{lang === 'el' ? 'Έτοιμες' : 'Presets'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSourceTab('camera');
              startCamera();
            }}
            className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              sourceTab === 'camera'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{lang === 'el' ? 'Κάμερα' : 'Camera'}</span>
          </button>
        </div>

        {/* ================= TAB 1: FILE UPLOAD ================= */}
        {sourceTab === 'upload' && (
          <div className="pt-1 space-y-2">
            <input
              id={uniqueId}
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileInputChange}
            />

            <label
              htmlFor={uniqueId}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`w-full py-5 px-4 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-center select-none ${
                isDragging
                  ? 'border-amber-400 bg-amber-500/10 scale-[0.99]'
                  : 'border-slate-700 bg-slate-900/60 hover:bg-slate-900 hover:border-amber-500/70'
              }`}
            >
              {isProcessingFile ? (
                <div className="flex flex-col items-center gap-2 text-amber-400 py-2">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="text-xs font-bold">{lang === 'el' ? 'Επεξεργασία εικόνας...' : 'Processing image...'}</span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      {lang === 'el' ? 'Κάντε κλικ εδώ για επιλογή φωτογραφίας' : 'Click here to choose photo from device'}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {lang === 'el' ? 'ή σύρετε (drag & drop) το αρχείο εικόνας εδώ' : 'or drag & drop the image file here'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    JPG, PNG, WEBP, GIF, SVG
                  </span>
                </>
              )}
            </label>
          </div>
        )}

        {/* ================= TAB 2: INTERNET URL ================= */}
        {sourceTab === 'url' && (
          <div className="space-y-2.5 pt-1">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setUrlError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyUrl(false);
                  }
                }}
                placeholder="https://example.com/photo.jpg"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!urlInput.trim() || isTestingUrl}
                  onClick={() => handleApplyUrl(false)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isTestingUrl ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>...</span>
                    </>
                  ) : (
                    <span>{lang === 'el' ? 'Εφαρμογή' : 'Apply'}</span>
                  )}
                </button>

                {urlInput.trim() && (
                  <button
                    type="button"
                    onClick={() => handleApplyUrl(true)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
                    title={lang === 'el' ? 'Χρήση του συνδέσμου χωρίς έλεγχο' : 'Use directly without pre-check'}
                  >
                    {lang === 'el' ? 'Άμεση Χρήση' : 'Direct'}
                  </button>
                )}
              </div>
            </div>

            {urlError && (
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800 text-[11px] text-rose-300 space-y-1.5">
                <div className="flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{urlError}</span>
                </div>
                {urlInput.trim() && (
                  <button
                    type="button"
                    onClick={() => handleApplyUrl(true)}
                    className="text-xs font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer"
                  >
                    {lang === 'el' ? '→ Χρήση αυτού του συνδέσμου ούτως ή άλλως' : '→ Use this image URL anyway'}
                  </button>
                )}
              </div>
            )}

            <p className="text-[10px] text-slate-500">
              {lang === 'el'
                ? 'Υποστηρίζονται άμεσοι σύνδεσμοι εικόνων (π.χ. Unsplash, Wikimedia, Google Drive public links, direct JPG/PNG).'
                : 'Direct image links supported (e.g. Unsplash, Wikimedia, direct JPG/PNG).'}
            </p>
          </div>
        )}

        {/* ================= TAB 3: PRESETS LIBRARY ================= */}
        {sourceTab === 'presets' && (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-56 overflow-y-auto p-1">
              {presets.map((preset) => {
                const isSelected = value === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onChange(preset.url)}
                    className={`relative p-1.5 rounded-xl border transition-all flex flex-col items-center gap-1.5 text-center group cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/50'
                        : 'border-slate-800 bg-slate-900 hover:border-amber-500/60 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="w-full h-14 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center">
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-200 truncate w-full">
                      {preset.name}
                    </span>
                    {isSelected && (
                      <span className="absolute top-1 right-1 bg-amber-500 text-slate-950 rounded-full p-0.5 shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 4: CAMERA CAPTURE ================= */}
        {sourceTab === 'camera' && (
          <div className="space-y-3 pt-1">
            {cameraError ? (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            ) : isCameraActive ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden bg-black border border-slate-700 aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{lang === 'el' ? 'Λήψη Φωτογραφίας' : 'Capture Photo'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    {lang === 'el' ? 'Ακύρωση' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Camera className="w-4 h-4" />
                  <span>{lang === 'el' ? 'Ενεργοποίηση Κάμερας' : 'Start Camera'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
