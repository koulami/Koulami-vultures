import React, { useState } from 'react';
import { Sparkles, Maximize2, X, ExternalLink, Play, Film, Image as ImageIcon } from 'lucide-react';
import { QrScanMedia, Language } from '../types/game';

interface Props {
  media: QrScanMedia;
  lang: Language;
  onCloseModal?: () => void;
}

// Convert common video URLs to embeddable URLs
export function getEmbedVideoUrl(url: string): { type: 'youtube' | 'vimeo' | 'direct'; embedUrl: string } {
  const trimmed = url.trim();

  // YouTube matchers: youtube.com/watch?v=..., youtu.be/..., youtube.com/embed/..., youtube.com/shorts/...
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
    };
  }

  // Vimeo matcher: vimeo.com/123456789
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
    };
  }

  // Direct video or data URL
  return {
    type: 'direct',
    embedUrl: trimmed
  };
}

export const UnlockedMediaViewer: React.FC<Props> = ({ media, lang }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isVideo = media.type === 'video';
  const videoInfo = isVideo ? getEmbedVideoUrl(media.url) : null;

  return (
    <div className="space-y-3.5">
      {/* Unlocked Header Banner */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-cyan-500/20 border border-amber-500/40 shadow-inner">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
              {lang === 'el' ? 'ΞΕΚΛΕΙΔΩΜΕΝΟ ΥΛΙΚΟ' : 'UNLOCKED MEDIA'}
            </h4>
            <p className="text-[11px] text-slate-300 font-medium">
              {media.title || (isVideo ? (lang === 'el' ? 'Βίντεο Σταθμού' : 'Station Video') : (lang === 'el' ? 'Φωτογραφία Σταθμού' : 'Station Photo'))}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
          title={lang === 'el' ? 'Πλήρης Προβολή' : 'Fullscreen View'}
        >
          <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">{lang === 'el' ? 'Μεγέθυνση' : 'Expand'}</span>
        </button>
      </div>

      {/* Main Media Player / Frame */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl flex items-center justify-center">
        {isVideo && videoInfo ? (
          videoInfo.type === 'direct' ? (
            <video
              src={videoInfo.embedUrl}
              controls
              autoPlay
              playsInline
              className="w-full max-h-[380px] object-contain rounded-2xl bg-black"
            >
              Your browser does not support HTML5 video.
            </video>
          ) : (
            <div className="w-full aspect-video">
              <iframe
                src={videoInfo.embedUrl}
                title={media.title || 'Station Video'}
                className="w-full h-full rounded-2xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )
        ) : (
          <div className="relative w-full max-h-[380px] flex items-center justify-center bg-slate-950 p-1">
            <img
              src={media.url}
              alt={media.title || 'Unlocked Photo'}
              className="w-full h-auto max-h-[380px] object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>

      {/* Caption & Description */}
      {media.caption && (
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 leading-relaxed">
          <p>{media.caption}</p>
        </div>
      )}

      {/* Fullscreen / Lightbox Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/95 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2">
                {isVideo ? (
                  <Film className="w-4 h-4 text-amber-400" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                )}
                <span className="text-sm font-bold text-slate-200">
                  {media.title || (isVideo ? (lang === 'el' ? 'Βίντεο' : 'Video') : (lang === 'el' ? 'Φωτογραφία' : 'Photo'))}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title={lang === 'el' ? 'Κλείσιμο' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Content */}
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/80 min-h-[320px]">
              {isVideo && videoInfo ? (
                videoInfo.type === 'direct' ? (
                  <video
                    src={videoInfo.embedUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full max-h-[70vh] object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-full aspect-video max-h-[75vh]">
                    <iframe
                      src={videoInfo.embedUrl}
                      title={media.title || 'Video'}
                      className="w-full h-full rounded-xl"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )
              ) : (
                <img
                  src={media.url}
                  alt={media.title || 'Photo'}
                  className="max-w-full max-h-[75vh] object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Footer with caption */}
            {media.caption && (
              <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 text-xs text-slate-300">
                {media.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
