import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const baseURL = process.env.LLM_BASE_URL ?? 'https://api.openai.com/v1';
const apiKey = process.env.LLM_API_KEY ?? 'missing';

if (apiKey === 'missing') {
  // eslint-disable-next-line no-console
  console.warn('[llm] LLM_API_KEY not set — requests will fail');
}

export const llm = new OpenAI({ baseURL, apiKey });

export const llmConfig = {
  model: process.env.LLM_MODEL ?? 'gpt-4o-mini',
  temperature: Number(process.env.LLM_TEMPERATURE ?? 0.4),
  maxTokens: Number(process.env.LLM_MAX_TOKENS ?? 2048),
  baseURL,
};
