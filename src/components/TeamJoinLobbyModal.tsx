import React, { useState } from 'react';
import { QrCode, Copy, Check, Users, Play, Clock, Sparkles, X } from 'lucide-react';
import { GameState, Language, Team } from '../types/game';
import { translations } from '../locales/translations';

interface Props {
  gameState: GameState;
  activeTeam: Team;
  onSelectTeam: (teamId: string) => void;
  lang: Language;
  onClose?: () => void;
  isFacilitator?: boolean;
  onStartGame?: () => void;
}

export const TeamJoinLobbyModal: React.FC<Props> = ({
  gameState,
  activeTeam,
  onSelectTeam,
  lang,
  onClose,
  isFacilitator = false,
  onStartGame
}) => {
  const t = translations[lang];
  const [copied, setCopied] = useState<boolean>(false);

  // Derive current join URL
  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?join=true`
    : 'https://boundpad.app?join=true';

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(joinUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 p-6 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">{t.showJoinQr}</h2>
              <p className="text-xs text-slate-400">{t.scanToJoinHelp}</p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* QR Code Presentation for Whiteboard / Tablets */}
        <div className="p-6 rounded-2xl bg-white flex flex-col items-center justify-center space-y-3 text-center shadow-inner">
          <div className="p-2 bg-white rounded-xl">
            <svg width="180" height="180" viewBox="0 0 180 180">
              <rect width="180" height="180" fill="white" />
              {/* Corner 1 */}
              <rect x="15" y="15" width="40" height="40" fill="black" />
              <rect x="22" y="22" width="26" height="26" fill="white" />
              <rect x="29" y="29" width="12" height="12" fill="black" />
              {/* Corner 2 */}
              <rect x="125" y="15" width="40" height="40" fill="black" />
              <rect x="132" y="22" width="26" height="26" fill="white" />
              <rect x="139" y="29" width="12" height="12" fill="black" />
              {/* Corner 3 */}
              <rect x="15" y="125" width="40" height="40" fill="black" />
              <rect x="22" y="132" width="26" height="26" fill="white" />
              <rect x="29" y="139" width="12" height="12" fill="black" />
              {/* Alignment pattern */}
              <rect x="125" y="125" width="25" height="25" fill="black" />
              <rect x="130" y="130" width="15" height="15" fill="white" />
              <rect x="135" y="135" width="5" height="5" fill="black" />
              {/* Data clusters */}
              <g fill="black">
                <rect x="70" y="20" width="10" height="10" />
                <rect x="85" y="35" width="10" height="10" />
                <rect x="100" y="20" width="10" height="10" />
                <rect x="70" y="55" width="10" height="10" />
                <rect x="90" y="70" width="10" height="10" />
                <rect x="110" y="55" width="10" height="10" />
                <rect x="25" y="70" width="10" height="10" />
                <rect x="45" y="85" width="10" height="10" />
                <rect x="70" y="90" width="10" height="10" />
                <rect x="90" y="110" width="10" height="10" />
                <rect x="120" y="90" width="10" height="10" />
                <rect x="140" y="105" width="10" height="10" />
                <rect x="70" y="130" width="10" height="10" />
                <rect x="90" y="145" width="10" height="10" />
              </g>
            </svg>
          </div>
          <p className="text-xs text-slate-800 font-mono font-semibold max-w-sm truncate">
            {joinUrl}
          </p>
        </div>

        {/* Copy Link button */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            <span>{copied ? t.linkCopied : t.copyJoinLink}</span>
          </button>
        </div>

        {/* Team Selection Grid */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-slate-300">
            {t.selectYourTeam}:
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {gameState.teams.map((tm) => {
              const isSelected = tm.id === activeTeam.id;
              return (
                <button
                  key={tm.id}
                  type="button"
                  onClick={() => onSelectTeam(tm.id)}
                  className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2.5 transition-all text-left ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500 text-amber-200 ring-2 ring-amber-500/30'
                      : 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-slate-300'
                  }`}
                >
                  <span className="text-xl p-1 bg-slate-900 rounded-lg">{tm.avatar}</span>
                  <div className="min-w-0">
                    <span className="font-bold block truncate">{tm.name}</span>
                    {tm.slogan && <span className="text-[10px] text-slate-400 block truncate">{tm.slogan}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Facilitator Start Button if in Lobby mode */}
        {isFacilitator && onStartGame && (
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onStartGame}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>{t.simultaneousStart}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
