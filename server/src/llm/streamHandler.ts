import type { Response } from 'express';
import { llm, llmConfig } from './client.js';
import { blockTools, toolCallToBlock } from './tools.js';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

/**
 * Writes a single SSE event.
 * Format: `event: <name>\ndata: <json>\n\n`
 */
function sseEvent(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Runs an OpenAI chat completion with tool calling + streaming.
 * Forwards each completed tool_call as a `block` SSE event.
 */
export async function runStreamingChat(
  systemPrompt: string,
  userPrompt: string,
  res: Response,
): Promise<void> {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();

  sseEvent(res, 'pending', {});

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    const stream = await llm.chat.completions.create({
      model: llmConfig.model,
      messages,
      tools: blockTools,
      tool_choice: 'required',
      temperature: llmConfig.temperature,
      max_tokens: llmConfig.maxTokens,
      stream: true,
    });

    // Track tool calls by index — OpenAI streams partial arguments in chunks
    const calls: Record<number, { name?: string; args: string }> = {};

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      // Accumulate tool call deltas
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          if (!calls[idx]) calls[idx] = { args: '' };
          if (tc.function?.name) calls[idx].name = tc.function.name;
          if (tc.function?.arguments) calls[idx].args += tc.function.arguments;
        }
      }

      // When a tool call completes (finish_reason === 'tool_calls'), emit blocks
      const finishReason = chunk.choices[0]?.finish_reason;
      if (finishReason === 'tool_calls' || finishReason === 'stop') {
        for (const idx of Object.keys(calls).map(Number).sort((a, b) => a - b)) {
          const { name, args } = calls[idx];
          if (!name) continue;
          let parsed: unknown;
          try {
            parsed = JSON.parse(args);
          } catch (e) {
            console.error(`[llm] failed to parse args for ${name}:`, args.slice(0, 200));
            continue;
          }
          const block = toolCallToBlock(name, parsed);
          if (block) {
            sseEvent(res, 'block', { block });
          }
        }
      }
    }

    sseEvent(res, 'done', {});
  } catch (err: any) {
    console.error('[llm] error:', err?.message ?? err);
    sseEvent(res, 'error', { message: err?.message ?? 'LLM request failed' });
  } finally {
    res.end();
  }
}
