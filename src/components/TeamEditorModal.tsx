import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, Palette, Smile } from 'lucide-react';
import { Team, Language } from '../types/game';
import { translations } from '../locales/translations';

interface Props {
  team: Team | null; // If null, creates a new team
  isOpen: boolean;
  onClose: () => void;
  onSave: (team: Team) => void;
  lang: Language;
}

const PRESET_EMOJIS = [
  '🦁', '🦅', '🚀', '🐬', '🦊', '⚡', '🌟', '🎯',
  '🏆', '🔥', '🦉', '🐺', '🦄', '🏹', '💎', '⚓',
  '🍀', '🌍', '👑', '🐯', '🐼', '🐲', '🏎️', '🎨'
];

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#6366f1'  // Indigo
];

export const TeamEditorModal: React.FC<Props> = ({
  team,
  isOpen,
  onClose,
  onSave,
  lang
}) => {
  const t = translations[lang];

  const [name, setName] = useState<string>('');
  const [nameEn, setNameEn] = useState<string>('');
  const [avatar, setAvatar] = useState<string>('🦁');
  const [color, setColor] = useState<string>('#3b82f6');
  const [slogan, setSlogan] = useState<string>('');
  const [sloganEn, setSloganEn] = useState<string>('');
  const [teamLangTab, setTeamLangTab] = useState<'el' | 'en'>(lang);

  useEffect(() => {
    if (team) {
      setName(team.name || '');
      setNameEn(team.name_en || '');
      setAvatar(team.avatar || '🦁');
      setColor(team.color || '#3b82f6');
      setSlogan(team.slogan || '');
      setSloganEn(team.slogan_en || '');
    } else {
      setName('');
      setNameEn('');
      setAvatar('🌟');
      setColor('#ec4899');
      setSlogan('');
      setSloganEn('');
    }
    setTeamLangTab(lang);
  }, [team, isOpen, lang]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const savedTeam: Team = {
      id: team ? team.id : `team-${Date.now()}`,
      name: name.trim(),
      name_en: nameEn.trim() || undefined,
      avatar: avatar.trim() || '🌟',
      color: color || '#3b82f6',
      slogan: slogan.trim() || undefined,
      slogan_en: sloganEn.trim() || undefined,
      questionOrder: team?.questionOrder,
      sequentialProgression: team?.sequentialProgression
    };

    onSave(savedTeam);
    onClose();
  };

  const isEditing = !!team;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                {isEditing ? (lang === 'el' ? 'Επεξεργασία Ομάδας & Ονόματος' : 'Edit Team & Name') : t.addTeam}
              </h3>
              <p className="text-[11px] text-slate-400">
                {lang === 'el' ? 'Αλλάξτε το όνομα, το σύνθημα, το avatar και το χρώμα της ομάδας' : 'Change team name, slogan, avatar emoji and theme color'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Language Switcher Tab */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs font-semibold text-slate-300 px-2">
              🌐 {lang === 'el' ? 'Γλώσσα Ονόματος & Συνθήματος:' : 'Name & Slogan Language:'}
            </span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setTeamLangTab('el')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  teamLangTab === 'el'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🇬🇷 Ελληνικά
              </button>
              <button
                type="button"
                onClick={() => setTeamLangTab('en')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  teamLangTab === 'en'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          {/* Live Preview Card */}
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              {lang === 'el' ? 'Προεπισκόπηση Κάρτας Ομάδας' : 'Live Team Card Preview'}
            </span>
            <div
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 shadow-inner"
              style={{ borderTop: `4px solid ${color}` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl p-1.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0 shadow-sm">
                  {avatar || '⭐'}
                </span>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-100 truncate">
                    {(teamLangTab === 'en' ? nameEn.trim() || name.trim() : name.trim() || nameEn.trim()) || (lang === 'el' ? 'Όνομα Ομάδας...' : 'Team Name...')}
                  </h4>
                  <p className="text-xs text-slate-400 truncate italic">
                    {(teamLangTab === 'en' ? sloganEn.trim() || slogan.trim() : slogan.trim() || sloganEn.trim()) || (lang === 'el' ? 'Χωρίς σύνθημα' : 'No slogan')}
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-amber-400">
                <span>0</span>
                <span className="text-[10px] text-slate-500">{t.pts}</span>
              </div>
            </div>
          </div>

          {/* Greek Tab Content */}
          {teamLangTab === 'el' && (
            <div className="space-y-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  {lang === 'el' ? 'Όνομα Ομάδας (Ελληνικά)' : 'Team Name (Greek)'} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="π.χ. Ομάδα Α: Οι Εξερευνητές"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm text-slate-100 placeholder-slate-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  {lang === 'el' ? 'Σύνθημα Ομάδας (Ελληνικά)' : 'Team Slogan (Greek)'} <span className="text-slate-500 font-normal">({lang === 'el' ? 'Προαιρετικό' : 'Optional'})</span>
                </label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder="π.χ. Ανακαλύπτουμε τα πάντα!"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm text-slate-100 placeholder-slate-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* English Tab Content */}
          {teamLangTab === 'en' && (
            <div className="space-y-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-amber-300">
                    Team Name (English)
                  </label>
                  {!nameEn && name && (
                    <button
                      type="button"
                      onClick={() => setNameEn(name)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 underline"
                    >
                      {lang === 'el' ? 'Αντιγραφή από Ελληνικά' : 'Copy from Greek'}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Team A: The Explorers"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm text-slate-100 placeholder-slate-500 transition-colors"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {lang === 'el' ? 'Το όνομα που θα εμφανίζεται όταν η εφαρμογή είναι στα Αγγλικά.' : 'Name shown when app language is English.'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-amber-300">
                    Team Slogan (English)
                  </label>
                  {!sloganEn && slogan && (
                    <button
                      type="button"
                      onClick={() => setSloganEn(slogan)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 underline"
                    >
                      {lang === 'el' ? 'Αντιγραφή από Ελληνικά' : 'Copy from Greek'}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={sloganEn}
                  onChange={(e) => setSloganEn(e.target.value)}
                  placeholder="e.g. Discovering everything!"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm text-slate-100 placeholder-slate-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Avatar Emoji Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.teamAvatar}</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {lang === 'el' ? 'Επιλέξτε ή πληκτρολογήστε emoji' : 'Pick or type custom emoji'}
              </span>
            </div>

            <div className="grid grid-cols-8 gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800 mb-2">
              {PRESET_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`h-9 rounded-lg flex items-center justify-center text-lg transition-all cursor-pointer ${
                    avatar === emoji
                      ? 'bg-amber-500/20 border-2 border-amber-400 scale-105 shadow-sm'
                      : 'hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{lang === 'el' ? 'Προσαρμοσμένο Avatar:' : 'Custom Avatar:'}</span>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                maxLength={4}
                className="w-16 p-1.5 rounded-lg bg-slate-950 border border-slate-700 text-center text-base"
              />
            </div>
          </div>

          {/* Team Color Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.teamColor}</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">{color}</span>
            </div>

            <div className="grid grid-cols-10 gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 mb-2">
              {PRESET_COLORS.map((clr) => (
                <button
                  key={clr}
                  type="button"
                  onClick={() => setColor(clr)}
                  className={`w-7 h-7 rounded-lg transition-transform cursor-pointer relative flex items-center justify-center ${
                    color.toLowerCase() === clr.toLowerCase()
                      ? 'scale-110 ring-2 ring-white shadow-md'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: clr }}
                >
                  {color.toLowerCase() === clr.toLowerCase() && (
                    <Check className="w-4 h-4 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{lang === 'el' ? 'Επιλογή από παλέτα:' : 'Custom color picker:'}</span>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-8 rounded-lg bg-transparent border border-slate-700 cursor-pointer p-0.5"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? (lang === 'el' ? 'Αποθήκευση Αλλαγών' : 'Save Changes') : t.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
