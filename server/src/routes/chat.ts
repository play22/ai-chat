import { Router } from 'express';
import { runStreamingChat } from '../llm/streamHandler.js';
import { mainSystemPrompt } from '../llm/systemPrompts.js';
import type { ChatContext } from '../types.js';

const router = Router();

interface ChatBody {
  prompt: string;
  context: ChatContext;
}

router.post('/chat', async (req, res) => {
  const { prompt, context } = (req.body ?? {}) as Partial<ChatBody>;

  if (typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'prompt required' });
    return;
  }
  if (!context || !Array.isArray(context.agents)) {
    res.status(400).json({ error: 'context.agents required' });
    return;
  }

  const systemPrompt = mainSystemPrompt(context);
  await runStreamingChat(systemPrompt, prompt, res);
});

export default router;
