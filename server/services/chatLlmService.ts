import { config } from '../config.js';
import { ChatError } from '../types/chat.js';

export interface LlmMessage { role: 'system' | 'user' | 'assistant'; content: string }

export async function generateChatReply(messages: LlmMessage[], fetcher: typeof fetch = fetch): Promise<string> {
  const settings = config.chat;
  if (!settings.apiKey || !settings.model) throw new ChatError(503, 'NutriBot chưa được cấu hình dịch vụ AI.');
  let endpoint: URL;
  try {
    endpoint = new URL(`${settings.baseUrl.replace(/\/$/, '')}/chat/completions`);
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw new Error();
  } catch { throw new ChatError(503, 'Cấu hình dịch vụ AI không hợp lệ.'); }
  try {
    const response = await fetcher(endpoint, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(settings.timeoutMs),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.apiKey}` },
      body: JSON.stringify({ model: settings.model, messages, max_tokens: 1000, stream: false }),
    });
    if (!response.ok) throw new ChatError(502, 'Dịch vụ AI chưa thể phản hồi. Vui lòng gửi lại.');
    const data = await response.json() as { choices?: { message?: { content?: unknown } }[] };
    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== 'string' || !reply.trim() || reply.length > 11000) {
      throw new ChatError(502, 'AI không trả về câu trả lời hợp lệ. Vui lòng gửi lại.');
    }
    return reply.trim();
  } catch (error) {
    if (error instanceof ChatError) throw error;
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new ChatError(504, 'AI phản hồi quá lâu. Vui lòng gửi lại.');
    }
    throw new ChatError(502, 'Không kết nối được dịch vụ AI. Vui lòng gửi lại.');
  }
}
