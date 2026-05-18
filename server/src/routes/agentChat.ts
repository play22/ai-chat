import { Router } from 'express';
import { runStreamingChat } from '../llm/streamHandler.js';
import { agentSystemPrompt } from '../llm/systemPrompts.js';
import type { AgentChatContext } from '../types.js';

const router = Router();

interface AgentChatBody {
  prompt: string;
  context: AgentChatContext;
}

router.post('/agent-chat', async (req, res) => {
  const { prompt, context } = (req.body ?? {}) as Partial<AgentChatBody>;

  if (typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'prompt required' });
    return;
  }
  if (!context?.agent?.id) {
    res.status(400).json({ error: 'context.agent.id required' });
    return;
  }

  const systemPrompt = agentSystemPrompt(context);
  await runStreamingChat(systemPrompt, prompt, res);
});

export default router;
