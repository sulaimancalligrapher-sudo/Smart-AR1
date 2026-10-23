/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API route for AI Translation using Gemini 3.8 Flash
app.post('/api/translate', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing text parameter' });
  }

  const trimmed = text.trim();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // If no API key is provided, return empty so client fallback takes over
    return res.status(200).json({ en: null, th: null, note: 'No GEMINI_API_KEY provided' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a professional educational translator. Translate the following Arabic UI label or instruction into both English and Thai for a Smart AR Textbook educational app.
Keep translations natural, concise, and suitable for user interface buttons, titles, or instructions.
Output MUST be a JSON object with exactly two keys: "en" and "th".

Arabic text: "${trimmed}"`;

    const aiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI translation timed out')), 4000)
    );

    const aiRes = (await Promise.race([aiPromise, timeoutPromise])) as any;

    const outputText = aiRes.text || '{}';
    const parsed = JSON.parse(outputText);
    return res.json({
      en: parsed.en || '',
      th: parsed.th || ''
    });
  } catch (error: any) {
    console.warn('Translation API fallback triggered:', error?.message || error);
    return res.status(200).json({ en: null, th: null, fallback: true });
  }
});

// Setup Vite in development or serve static in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
