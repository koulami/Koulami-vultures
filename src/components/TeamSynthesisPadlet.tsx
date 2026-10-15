import React, { useState } from 'react';
import { Plus, Trash2, Heart, MessageSquare, Image as ImageIcon, Send, Sparkles, X, User } from 'lucide-react';
import { Team, TeamSynthesisNote, Language } from '../types/game';
import { translations } from '../locales/translations';
import { ImageSourcePicker } from './ImageSourcePicker';
import { sound } from '../services/sound';

interface Props {
  team: Team;
  notes: TeamSynthesisNote[];
  synthesisPrompt?: string;
  lang: Language;
  onAddNote: (note: Omit<TeamSynthesisNote, 'id' | 'createdAt'>) => void;
  onDeleteNote: (noteId: string) => void;
  onLikeNote?: (noteId: string) => void;
  onAddTeacherFeedback?: (noteId: string, feedback: string) => void;
  isFacilitator?: boolean;
}

export const TeamSynthesisPadlet: React.FC<Props> = ({
  team,
  notes,
  synthesisPrompt,
  lang,
  onAddNote,
  onDeleteNote,
  onLikeNote,
  onAddTeacherFeedback,
  isFacilitator = false
}) => {
  const t = translations[lang];
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newAuthor, setNewAuthor] = useState<string>('');
  const [newImageUrl, setNewImageUrl] = useState<string>('');

  const [feedbackInputId, setFeedbackInputId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>('');

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    sound.playSnap();
    onAddNote({
      teamId: team.id,
      title: newTitle.trim(),
      content: newContent.trim(),
      author: newAuthor.trim() || undefined,
      imageUrl: newImageUrl || undefined,
      likes: 0
    });

    setNewTitle('');
    setNewContent('');
    setNewAuthor('');
    setNewImageUrl('');
    setShowAddModal(false);
  };

  const teamNotes = notes.filter(n => n.teamId === team.id);

  const handleSendFeedback = (noteId: string) => {
    if (!feedbackText.trim() || !onAddTeacherFeedback) return;
    onAddTeacherFeedback(noteId, feedbackText.trim());
    setFeedbackInputId(null);
    setFeedbackText('');
  };

  return (
    <div className="space-y-4">
      {/* Facilitator Prompt Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.color }} />
            <h3 className="font-bold text-sm text-amber-300">
              {t.postMissionPadlet} · {team.name}
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {synthesisPrompt || t.synthesisInstructions}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-amber-500/20 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addPadletNote}</span>
        </button>
      </div>

      {/* Sticky Notes Grid */}
      {teamNotes.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-slate-800 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-900 mx-auto flex items-center justify-center text-slate-500">
            <MessageSquare className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-400">
            {lang === 'el'
              ? 'Δεν έχετε προσθέσει κάρτες συμπερασμάτων ακόμα. Πατήστε "Νέο Εύρημα / Κάρτα" για να γράψετε τις πληροφορίες που ανακαλύψατε!'
              : 'No synthesis cards added yet. Click "New Finding / Card" to record the information discovered!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {teamNotes.map((note) => (
            <div
              key={note.id}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-3 shadow-md hover:border-slate-700 transition-all relative group"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-100 leading-snug">
                    {note.title}
                  </h4>
                  <button
                    type="button"
                    onClick={() => onDeleteNote(note.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 opacity-60 hover:opacity-100 transition-opacity shrink-0"
                    title={t.deleteNote}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {note.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 max-h-40 bg-slate-950 flex items-center justify-center">
                    <img
                      src={note.imageUrl}
                      alt={note.title}
                      className="w-full h-36 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>

              {/* Card Footer: Author, Like, Teacher Feedback */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{note.author || team.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onLikeNote && (
                      <button
                        type="button"
                        onClick={() => onLikeNote(note.id)}
                        className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/40" />
                        <span>{note.likes || 0}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Facilitator comment if present */}
                {note.feedbackComment && (
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-semibold block">{t.teacherFeedback}:</span>
                      <span>{note.feedbackComment}</span>
                    </div>
                  </div>
                )}

                {/* Facilitator Add Feedback Box */}
                {isFacilitator && onAddTeacherFeedback && (
                  <div>
                    {feedbackInputId === note.id ? (
                      <div className="flex gap-1.5 pt-1">
                        <input
                          type="text"
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder="Σχόλιο ή αστέρι..."
                          className="flex-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleSendFeedback(note.id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setFeedbackInputId(note.id);
                          setFeedbackText(note.feedbackComment || '');
                        }}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold"
                      >
                        + {t.addTeacherFeedback}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Synthesis Note */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleCreateNote}
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-5 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.color }} />
                <span>{t.addPadletNote}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'el' ? 'Τίτλος Ευρήματος / Στοιχείου' : 'Finding / Clue Title'}
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t.noteTitlePlaceholder}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'el' ? 'Ανάλυση Πληροφοριών & Συμπεράσματα' : 'Information Analysis & Conclusions'}
              </label>
              <textarea
                required
                rows={4}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder={t.noteContentPlaceholder}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'el' ? 'Όνομα Μέλους / Συντάκτη (Προαιρετικό)' : 'Member Name (Optional)'}
              </label>
              <input
                type="text"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder={t.noteAuthorPlaceholder}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Optional Photo / Evidence */}
            <ImageSourcePicker
              value={newImageUrl}
              onChange={setNewImageUrl}
              lang={lang}
              label={lang === 'el' ? 'Φωτογραφία / Αποδεικτικό Στοιχείο (Προαιρετικό)' : 'Photo / Evidence (Optional)'}
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                {t.save}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
