import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  const ai = new GoogleGenAI();

  // Helper to translate single text using Gemini or MyMemory fallback
  async function translateTextWithGemini(text: string): Promise<string> {
    if (!text || !text.trim()) return '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        config: {
          systemInstruction:
            'You are a direct Greek-to-English educational translator. Translate Greek educational text accurately and naturally into English. Output ONLY the raw translated English text, with absolutely no commentary, no preamble, no markdown formatting, and no conversational filler.'
        },
        contents: text.trim()
      });
      const translated = response.text?.trim();
      if (translated && !translated.toLowerCase().startsWith('the translation of') && !translated.startsWith('{')) {
        return translated;
      }
    } catch (err) {
      console.warn('Gemini translate failed, trying MyMemory:', err);
    }

    // Fallback to MyMemory
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=el|en`);
      if (res.ok) {
        const data = await res.json();
        if (data?.responseData?.translatedText && !data.responseData.translatedText.includes('MYMEMORY WARNING')) {
          return data.responseData.translatedText
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
        }
      }
    } catch (e) {
      console.warn('MyMemory fallback failed:', e);
    }

    return text;
  }

  // Single or batch text translation endpoint
  app.post('/api/translate', async (req, res) => {
    try {
      const { text, texts } = req.body;
      if (typeof text === 'string') {
        const translated = await translateTextWithGemini(text);
        return res.json({ translated });
      }
      if (Array.isArray(texts)) {
        const translated = await Promise.all(texts.map((t: string) => translateTextWithGemini(t)));
        return res.json({ translated });
      }
      return res.status(400).json({ error: 'text or texts required' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Translation failed' });
    }
  });

  // Full question translation endpoint: translates Greek question fields into exact matching English fields
  app.post('/api/translate-question', async (req, res) => {
    try {
      const { question } = req.body;
      if (!question) return res.status(400).json({ error: 'Question required' });

      const prompt = `You are an educational translator.
Translate the following Greek quiz/quest fields into accurate, natural English.
Translate ONLY what is provided in the Greek text. Do NOT mix with other questions. Do NOT invent new content.
Input Greek object:
${JSON.stringify({
  title: question.title,
  description: question.description,
  explanation: question.explanation,
  payload: question.payload
}, null, 2)}

Return ONLY valid JSON matching this schema:
{
  "title_en": string,
  "description_en": string,
  "explanation_en": string,
  "payload_en": object
}`;

      let translatedObj: any = null;
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });
        if (response.text) {
          translatedObj = JSON.parse(response.text);
        }
      } catch (geminiErr) {
        console.warn('Gemini structured question translation failed:', geminiErr);
      }

      if (translatedObj) {
        return res.json({
          title_en: translatedObj.title_en || (await translateTextWithGemini(question.title)),
          description_en: translatedObj.description_en || (await translateTextWithGemini(question.description)),
          explanation_en: translatedObj.explanation_en !== undefined ? translatedObj.explanation_en : (question.explanation ? await translateTextWithGemini(question.explanation) : undefined),
          payload_en: translatedObj.payload_en || undefined
        });
      }

      // Fallback: translate individual fields
      const title_en = await translateTextWithGemini(question.title);
      const description_en = await translateTextWithGemini(question.description);
      const explanation_en = question.explanation ? await translateTextWithGemini(question.explanation) : undefined;
      let payload_en: any = undefined;

      if (question.type === 'multiple_choice' && Array.isArray(question.payload?.options)) {
        const options_en = await Promise.all(question.payload.options.map((o: string) => translateTextWithGemini(o)));
        payload_en = { ...question.payload, options: options_en };
      } else if (question.type === 'text_match' && Array.isArray(question.payload?.pairs)) {
        const pairs_en = await Promise.all(question.payload.pairs.map(async (p: any) => ({
          ...p,
          left: await translateTextWithGemini(p.left),
          right: await translateTextWithGemini(p.right)
        })));
        payload_en = { ...question.payload, pairs: pairs_en };
      } else if (question.type === 'image_match' && Array.isArray(question.payload?.pairs)) {
        const pairs_en = await Promise.all(question.payload.pairs.map(async (p: any) => ({
          ...p,
          text: await translateTextWithGemini(p.text)
        })));
        payload_en = { ...question.payload, pairs: pairs_en };
      } else if (question.type === 'qr_scan') {
        payload_en = {
          ...question.payload,
          locationHint: question.payload?.locationHint ? await translateTextWithGemini(question.payload.locationHint) : undefined
        };
      } else if (question.type === 'photo_upload') {
        payload_en = {
          ...question.payload,
          instructions: question.payload?.instructions ? await translateTextWithGemini(question.payload.instructions) : undefined
        };
      } else if (question.type === 'task') {
        const checklist_en = Array.isArray(question.payload?.checklist)
          ? await Promise.all(question.payload.checklist.map((c: string) => translateTextWithGemini(c)))
          : undefined;
        payload_en = {
          ...question.payload,
          instructions: question.payload?.instructions ? await translateTextWithGemini(question.payload.instructions) : undefined,
          checklist: checklist_en,
          completionPrompt: question.payload?.completionPrompt ? await translateTextWithGemini(question.payload.completionPrompt) : undefined
        };
      }

      return res.json({ title_en, description_en, explanation_en, payload_en });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Bulk questions translation endpoint
  app.post('/api/translate-all-questions', async (req, res) => {
    try {
      const { questions } = req.body;
      if (!Array.isArray(questions)) return res.status(400).json({ error: 'questions array required' });

      const translatedQuestions = await Promise.all(
        questions.map(async (q: any) => {
          try {
            const title_en = q.title ? await translateTextWithGemini(q.title) : q.title_en;
            const description_en = q.description ? await translateTextWithGemini(q.description) : q.description_en;
            const explanation_en = q.explanation ? await translateTextWithGemini(q.explanation) : q.explanation_en;

            let payload_en = q.payload_en;
            if (q.type === 'multiple_choice' && Array.isArray(q.payload?.options)) {
              const options_en = await Promise.all(q.payload.options.map((o: string) => translateTextWithGemini(o)));
              payload_en = { ...q.payload, options: options_en };
            } else if (q.type === 'text_match' && Array.isArray(q.payload?.pairs)) {
              const pairs_en = await Promise.all(q.payload.pairs.map(async (p: any) => ({
                ...p,
                left: await translateTextWithGemini(p.left),
                right: await translateTextWithGemini(p.right)
              })));
              payload_en = { ...q.payload, pairs: pairs_en };
            } else if (q.type === 'image_match' && Array.isArray(q.payload?.pairs)) {
              const pairs_en = await Promise.all(q.payload.pairs.map(async (p: any) => ({
                ...p,
                text: await translateTextWithGemini(p.text)
              })));
              payload_en = { ...q.payload, pairs: pairs_en };
            } else if (q.type === 'task') {
              const checklist_en = Array.isArray(q.payload?.checklist)
                ? await Promise.all(q.payload.checklist.map((c: string) => translateTextWithGemini(c)))
                : undefined;
              payload_en = {
                ...q.payload,
                instructions: q.payload?.instructions ? await translateTextWithGemini(q.payload.instructions) : undefined,
                checklist: checklist_en,
                completionPrompt: q.payload?.completionPrompt ? await translateTextWithGemini(q.payload.completionPrompt) : undefined
              };
            }

            return {
              ...q,
              title_en,
              description_en,
              explanation_en,
              payload_en
            };
          } catch (e) {
            console.error('Failed translating single question in bulk:', e);
            return q;
          }
        })
      );

      return res.json({ questions: translatedQuestions });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Mount Vite middlewares in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
