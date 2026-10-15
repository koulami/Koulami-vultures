/**
 * High-quality English translation engine for educational quizzes, quests, and game content.
 * Integrates server-side Gemini neural translation with MyMemory fallback
 * to accurately translate user Greek text into English without mixing or dropping content.
 */

import { Question } from '../types/game';

const translationCache = new Map<string, string>();

// Pre-fill common game phrases for instantaneous sync render
const COMMON_DICTIONARY: Record<string, string> = {
  'Επιλογή 1': 'Option 1',
  'Επιλογή 2': 'Option 2',
  'Επιλογή 3': 'Option 3',
  'Επιλογή 4': 'Option 4',
  'Στοιχείο Α': 'Item A',
  'Στοιχείο Β': 'Item B',
  'Ταίρι Α': 'Match A',
  'Ταίρι Β': 'Match B',
  'Σωστό': 'True',
  'Λάθος': 'False',
  'Ναι': 'Yes',
  'Όχι': 'No',
  'Ομάδα 1': 'Team 1',
  'Ομάδα 2': 'Team 2',
  'Ομάδα 3': 'Team 3',
  'Ομάδα 4': 'Team 4',
  'Ομάδα Α: Οι Εξερευνητές': 'Team A: The Explorers',
  'Ομάδα Β: Οι Καινοτόμοι': 'Team B: The Innovators',
  'Ομάδα Γ: Οι Ταξιδιώτες': 'Team C: The Voyagers',
  'Ομάδα Δ: Οι Επιστήμονες': 'Team D: The Scientists',
  'Ανακαλύπτουμε τα πάντα!': 'Discovering everything!',
  'Ταχύτητα και σκέψη!': 'Speed and intellect!',
  'Στοχεύουμε στα αστέρια!': 'Aiming for the stars!',
  'Η λογική κερδίζει!': 'Logic prevails!'
};

Object.entries(COMMON_DICTIONARY).forEach(([k, v]) => {
  translationCache.set(k.trim(), v);
});

export function containsGreekCharacters(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return /[\u0370-\u03FF\u1F00-\u1FFF]/.test(text);
}

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_match, dec) => String.fromCharCode(dec))
    .replace(/^["'`]|["'`]$/g, '')
    .trim();
}

/**
 * Translates any arbitrary Greek sentence or text to natural English.
 * 1. Checks memory cache.
 * 2. Calls our /api/translate route (powered by Gemini 3.1 Flash Lite).
 * 3. Fallbacks to MyMemory public neural API directly if needed.
 */
export async function translateGreekToEnglishAsync(text: string): Promise<string> {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  if (translationCache.has(trimmed)) {
    return translationCache.get(trimmed)!;
  }

  // 1. Try our server-side Gemini endpoint
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed }),
      signal: AbortSignal.timeout(9000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.translated && typeof data.translated === 'string' && data.translated.trim()) {
        const clean = decodeHtmlEntities(data.translated.trim());
        if (clean && !clean.toLowerCase().startsWith('the translation of') && !clean.startsWith('{')) {
          translationCache.set(trimmed, clean);
          return clean;
        }
      }
    }
  } catch {
    // server route unavailable or timeout, try direct fallback
  }

  // 2. Direct client fallback via MyMemory
  try {
    const encoded = encodeURIComponent(trimmed);
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=el|en`;
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (response.ok) {
      const data = await response.json();
      if (data?.responseData?.translatedText) {
        const raw = decodeHtmlEntities(data.responseData.translatedText);
        if (
          !raw.toLowerCase().includes('mymemory warning') &&
          !raw.toLowerCase().includes('invalid query') &&
          raw.trim().length > 0
        ) {
          const clean = raw.trim();
          translationCache.set(trimmed, clean);
          return clean;
        }
      }
    }
  } catch {
    // fallback
  }

  return trimmed;
}

/**
 * Translates an entire Question object in one structured call via /api/translate-question.
 * Ensures the English version contains the exact translated counterpart of all fields:
 * title, description, explanation, and payload (options, pairs, instructions, checklist, etc.).
 */
export async function translateQuestionAsync(question: Question): Promise<{
  title_en: string;
  description_en: string;
  explanation_en?: string;
  payload_en?: any;
}> {
  // 1. Try server-side structured endpoint
  try {
    const res = await fetch('/api/translate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
      signal: AbortSignal.timeout(15000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.title_en) {
        const result = {
          title_en: decodeHtmlEntities(data.title_en),
          description_en: decodeHtmlEntities(data.description_en || data.title_en),
          explanation_en: data.explanation_en ? decodeHtmlEntities(data.explanation_en) : undefined,
          payload_en: data.payload_en
        };
        // Cache the title & description
        if (question.title) translationCache.set(question.title.trim(), result.title_en);
        if (question.description) translationCache.set(question.description.trim(), result.description_en);
        return result;
      }
    }
  } catch (err) {
    console.warn('Server structured translation failed, falling back to field translation:', err);
  }

  // 2. Fallback: translate individual fields
  const title_en = await translateGreekToEnglishAsync(question.title);
  const description_en = question.description
    ? await translateGreekToEnglishAsync(question.description)
    : title_en;
  const explanation_en = question.explanation
    ? await translateGreekToEnglishAsync(question.explanation)
    : undefined;

  let payload_en: any = undefined;
  const p = (question.payload as any) || {};

  if (question.type === 'multiple_choice' && Array.isArray(p.options)) {
    const opts = p.options;
    const translatedOpts = await Promise.all(opts.map((o: string) => translateGreekToEnglishAsync(o)));
    payload_en = { ...p, options: translatedOpts };
  } else if (question.type === 'text_match' && Array.isArray(p.pairs)) {
    const pairs = p.pairs;
    const translatedPairs = await Promise.all(
      pairs.map(async (pair: any) => ({
        ...pair,
        left: await translateGreekToEnglishAsync(pair.left),
        right: await translateGreekToEnglishAsync(pair.right)
      }))
    );
    payload_en = { ...p, pairs: translatedPairs };
  } else if (question.type === 'image_match' && Array.isArray(p.pairs)) {
    const pairs = p.pairs;
    const translatedPairs = await Promise.all(
      pairs.map(async (pair: any) => ({
        ...pair,
        text: await translateGreekToEnglishAsync(pair.text)
      }))
    );
    payload_en = { ...p, pairs: translatedPairs };
  } else if (question.type === 'qr_scan') {
    payload_en = {
      ...p,
      locationHint: p.locationHint ? await translateGreekToEnglishAsync(p.locationHint) : undefined,
      unlockedMedia: p.unlockedMedia
        ? {
            ...p.unlockedMedia,
            title: p.unlockedMedia.title ? await translateGreekToEnglishAsync(p.unlockedMedia.title) : undefined,
            caption: p.unlockedMedia.caption ? await translateGreekToEnglishAsync(p.unlockedMedia.caption) : undefined
          }
        : undefined
    };
  } else if (question.type === 'photo_upload') {
    payload_en = {
      ...p,
      instructions: p.instructions ? await translateGreekToEnglishAsync(p.instructions) : undefined
    };
  } else if (question.type === 'task') {
    const checklist_en = Array.isArray(p.checklist)
      ? await Promise.all(p.checklist.map((c: string) => translateGreekToEnglishAsync(c)))
      : undefined;
    payload_en = {
      ...p,
      instructions: p.instructions ? await translateGreekToEnglishAsync(p.instructions) : undefined,
      checklist: checklist_en,
      completionPrompt: p.completionPrompt ? await translateGreekToEnglishAsync(p.completionPrompt) : undefined
    };
  }

  return { title_en, description_en, explanation_en, payload_en };
}

/**
 * Translates an entire array of questions in bulk.
 */
export async function translateAllQuestionsAsync(questions: Question[]): Promise<Question[]> {
  try {
    const res = await fetch('/api/translate-all-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions }),
      signal: AbortSignal.timeout(30000)
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.questions) && data.questions.length === questions.length) {
        return data.questions;
      }
    }
  } catch (err) {
    console.warn('Bulk translation endpoint failed, falling back to sequential question translation:', err);
  }

  // Fallback: translate individually
  return Promise.all(
    questions.map(async (q) => {
      try {
        const trans = await translateQuestionAsync(q);
        return {
          ...q,
          title_en: trans.title_en,
          description_en: trans.description_en,
          explanation_en: trans.explanation_en,
          payload_en: trans.payload_en || q.payload_en
        };
      } catch {
        return q;
      }
    })
  );
}

/**
 * Synchronous fast translation (used for instant render fallbacks).
 * If not in cache, automatically fires a background async translation so subsequent renders have it!
 */
export function translateGreekToEnglish(text: string): string {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  if (translationCache.has(trimmed)) {
    return translationCache.get(trimmed)!;
  }

  // Fire background translation so future renders update smoothly
  if (containsGreekCharacters(trimmed)) {
    translateGreekToEnglishAsync(trimmed).catch(() => {});
  }

  return trimmed;
}

export async function translateBatchGreekToEnglish(texts: string[]): Promise<string[]> {
  return Promise.all(texts.map((t) => translateGreekToEnglishAsync(t)));
}
