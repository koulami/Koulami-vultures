import type { Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI();
  }
  return aiInstance;
}

// Clean and decode HTML entities from fallback APIs
function cleanTranslationText(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/^["'`]|["'`]$/g, '')
    .trim();
}

export async function translateSingleText(text: string): Promise<string> {
  if (!text || !text.trim()) return '';
  const trimmed = text.trim();

  // Try Gemini 3.1 Flash Lite
  try {
    const ai = getAI();
    const resp = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      config: {
        systemInstruction:
          'You are a direct Greek-to-English educational translator. Translate Greek educational text accurately and naturally into English. Output ONLY the raw translated English text, with absolutely no commentary, no preamble, no markdown formatting, and no conversational filler.'
      },
      contents: trimmed
    });
    const result = resp.text?.trim();
    if (result && !result.toLowerCase().startsWith('the translation of') && !result.startsWith('{')) {
      return cleanTranslationText(result);
    }
  } catch (err) {
    console.warn('Gemini translateSingleText failed, falling back to MyMemory:', err);
  }

  // Fallback to MyMemory
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=el|en`, {
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText && !data.responseData.translatedText.includes('MYMEMORY WARNING')) {
        return cleanTranslationText(data.responseData.translatedText);
      }
    }
  } catch {
    // fallback
  }

  return trimmed;
}

export async function translateStructuredQuestion(question: any): Promise<{
  title_en: string;
  description_en: string;
  explanation_en?: string;
  payload_en?: any;
}> {
  if (!question) {
    throw new Error('Question object required');
  }

  // 1. Try Gemini with JSON response schema
  try {
    const ai = getAI();
    const greekPayload = question.payload || {};
    const inputObj = {
      title: question.title,
      description: question.description,
      explanation: question.explanation,
      type: question.type,
      payload: greekPayload
    };

    const prompt = `Translate this Greek educational quiz/activity into English.
Translate ALL Greek text fields into natural, accurate English:
- title -> title_en
- description -> description_en
- explanation -> explanation_en (if present)
- payload -> payload_en: translate all text inside options, checklist, instructions, text/image pairs, and prompts. Keep identical structure and IDs.

Greek Input:
${JSON.stringify(inputObj, null, 2)}

Return valid JSON with keys:
{
  "title_en": "string",
  "description_en": "string",
  "explanation_en": "string or null",
  "payload_en": "object"
}`;

    const resp = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      config: {
        responseMimeType: 'application/json',
        systemInstruction:
          'You are a professional educational translator. Faithfully translate all Greek strings in the question to English without altering question logic, indices, or structure.'
      },
      contents: prompt
    });

    if (resp.text) {
      const parsed = JSON.parse(resp.text);
      if (parsed?.title_en) {
        return {
          title_en: cleanTranslationText(parsed.title_en),
          description_en: cleanTranslationText(parsed.description_en || parsed.title_en),
          explanation_en: parsed.explanation_en ? cleanTranslationText(parsed.explanation_en) : undefined,
          payload_en: parsed.payload_en || undefined
        };
      }
    }
  } catch (err) {
    console.warn('Gemini structured question translation failed, using field fallback:', err);
  }

  // 2. Field-by-field fallback
  const title_en = await translateSingleText(question.title);
  const description_en = question.description
    ? await translateSingleText(question.description)
    : title_en;
  const explanation_en = question.explanation
    ? await translateSingleText(question.explanation)
    : undefined;

  let payload_en: any = undefined;
  const p = question.payload || {};

  if (question.type === 'multiple_choice' && Array.isArray(p.options)) {
    const options_en = await Promise.all(p.options.map((o: string) => translateSingleText(o)));
    payload_en = { ...p, options: options_en };
  } else if (question.type === 'text_match' && Array.isArray(p.pairs)) {
    const pairs_en = await Promise.all(
      p.pairs.map(async (pair: any) => ({
        ...pair,
        left: await translateSingleText(pair.left),
        right: await translateSingleText(pair.right)
      }))
    );
    payload_en = { ...p, pairs: pairs_en };
  } else if (question.type === 'image_match' && Array.isArray(p.pairs)) {
    const pairs_en = await Promise.all(
      p.pairs.map(async (pair: any) => ({
        ...pair,
        text: await translateSingleText(pair.text)
      }))
    );
    payload_en = { ...p, pairs: pairs_en };
  } else if (question.type === 'qr_scan') {
    payload_en = {
      ...p,
      locationHint: p.locationHint ? await translateSingleText(p.locationHint) : undefined,
      unlockedMedia: p.unlockedMedia
        ? {
            ...p.unlockedMedia,
            title: p.unlockedMedia.title ? await translateSingleText(p.unlockedMedia.title) : undefined,
            caption: p.unlockedMedia.caption ? await translateSingleText(p.unlockedMedia.caption) : undefined
          }
        : undefined
    };
  } else if (question.type === 'photo_upload') {
    payload_en = {
      ...p,
      instructions: p.instructions ? await translateSingleText(p.instructions) : undefined
    };
  } else if (question.type === 'task') {
    const checklist_en = Array.isArray(p.checklist)
      ? await Promise.all(p.checklist.map((item: string) => translateSingleText(item)))
      : undefined;
    payload_en = {
      ...p,
      instructions: p.instructions ? await translateSingleText(p.instructions) : undefined,
      checklist: checklist_en,
      completionPrompt: p.completionPrompt ? await translateSingleText(p.completionPrompt) : undefined
    };
  }

  return { title_en, description_en, explanation_en, payload_en };
}

export function viteTranslatePlugin(): Plugin {
  return {
    name: 'vite-translate-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/translate')) {
          return next();
        }

        if (req.method !== 'POST') {
          return next();
        }

        // Read request body
        const chunks: Buffer[] = [];
        req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        req.on('end', async () => {
          try {
            const rawBody = Buffer.concat(chunks).toString('utf-8');
            const body = rawBody ? JSON.parse(rawBody) : {};

            if (req.url === '/api/translate') {
              const { text, texts } = body;
              if (typeof text === 'string') {
                const translated = await translateSingleText(text);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ translated }));
                return;
              }
              if (Array.isArray(texts)) {
                const translated = await Promise.all(texts.map((t: string) => translateSingleText(t)));
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ translated }));
                return;
              }
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'text or texts required' }));
              return;
            }

            if (req.url === '/api/translate-question') {
              const { question } = body;
              if (!question) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'question required' }));
                return;
              }
              const result = await translateStructuredQuestion(question);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
              return;
            }

            if (req.url === '/api/translate-all-questions') {
              const { questions } = body;
              if (!Array.isArray(questions)) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'questions array required' }));
                return;
              }

              const translatedQuestions = await Promise.all(
                questions.map(async (q: any) => {
                  try {
                    const trans = await translateStructuredQuestion(q);
                    return {
                      ...q,
                      title_en: trans.title_en,
                      description_en: trans.description_en,
                      explanation_en: trans.explanation_en,
                      payload_en: trans.payload_en || q.payload_en
                    };
                  } catch (e) {
                    console.error('Failed to translate question in bulk:', e);
                    return q;
                  }
                })
              );

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ questions: translatedQuestions }));
              return;
            }

            next();
          } catch (err: any) {
            console.error('Error in translate API plugin:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Internal translation error' }));
          }
        });
      });
    }
  };
}
