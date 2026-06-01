import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5173;

app.post('/api/gemini', async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'No message provided' });
  // Support Google Vertex/Generative Language (Gemini) or a generic endpoint.
  const PROVIDER = (process.env.GEMINI_PROVIDER || 'generic').toLowerCase();
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const MODEL = process.env.GEMINI_MODEL || 'text-bison-001';

  if (PROVIDER === 'google') {
    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY required for Google provider' });

    // Build a system prompt to ensure multilingual programming assistant behavior
    const systemPrompt = `You are a helpful programming assistant. Reply in the same language as the user. Provide clear, concise coding explanations, examples, and hints when requested.`;
    const promptText = `${systemPrompt}\n\nUser: ${message}`;

    const url = `https://generativelanguage.googleapis.com/v1beta2/models/${MODEL}:generate?key=${encodeURIComponent(GEMINI_API_KEY)}`;

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: { text: promptText }, temperature: 0.2 })
      });

      if (!resp.ok) {
        const txt = await resp.text();
        console.error('Vertex API error', resp.status, txt);
        return res.status(502).json({ error: 'Vertex API error', detail: txt });
      }

      const data = await resp.json();
      // text-bison/Generative Language returns candidates with `output` property
      const reply = (data?.candidates && data.candidates[0] && (data.candidates[0].output || data.candidates[0].content)) || data?.output || JSON.stringify(data);
      return res.json({ reply });
    } catch (err) {
      console.error('Gemini (Google) proxy error', err);
      return res.status(500).json({ error: 'Failed to contact Google generative endpoint' });
    }
  }

  // Generic provider fallback: POST to GEMINI_URL with Bearer key if provided
  const GEMINI_URL = process.env.GEMINI_URL;
  if (!GEMINI_URL) return res.status(500).json({ error: 'GEMINI_URL not configured for generic provider' });

  try {
    const resp = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(GEMINI_API_KEY ? { Authorization: `Bearer ${GEMINI_API_KEY}` } : {}),
      },
      body: JSON.stringify({ message })
    });

    const contentType = resp.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await resp.json();
    } else {
      data = await resp.text();
    }

    const reply = (data && (data.reply || data.output || data.text || data)) || 'No reply';
    res.json({ reply });
  } catch (err) {
    console.error('Gemini proxy error', err);
    res.status(500).json({ error: 'Failed to contact Gemini endpoint' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
