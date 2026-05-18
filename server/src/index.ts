import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat.js';
import agentChatRouter from './routes/agentChat.js';
import { llmConfig } from './llm/client.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: false }));
app.use(express.json({ limit: '1mb' }));

// Health
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    model: llmConfig.model,
    baseURL: llmConfig.baseURL,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', chatRouter);
app.use('/api', agentChatRouter);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[server] unhandled error:', err);
  res.status(500).json({ error: err?.message ?? 'internal error' });
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(`[server] CORS origin: ${FRONTEND_ORIGIN}`);
  console.log(`[server] LLM: ${llmConfig.baseURL} (model: ${llmConfig.model})`);
});
