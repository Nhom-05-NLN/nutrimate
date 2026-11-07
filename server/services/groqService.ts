import Groq from 'groq-sdk';
import { config } from '../config.js';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateGroqResponse(messages: GroqMessage[]): Promise<string> {
  if (!config.groq.apiKey) throw new Error('Groq fallback is not configured.');

  const groq = new Groq({ apiKey: config.groq.apiKey });
  const completion = await groq.chat.completions.create({
    model: config.groq.model,
    messages,
    temperature: 0.5,
    max_completion_tokens: 4096,
  });

  const content = completion.choices[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Groq returned an empty response.');
  }
  return content.trim();
}
