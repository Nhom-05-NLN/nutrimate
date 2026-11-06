import { config } from '../config.js';
import { ChatError } from '../types/chat.js';
import { generateGroqResponse } from './groqService.js';

export interface LlmMessage { role: 'system' | 'user' | 'assistant'; content: string }
type GroqGenerator = (messages: LlmMessage[]) => Promise<string>;

async function providerErrorCode(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: { status?: unknown; code?: unknown; type?: unknown } };
    const code = body.error?.status ?? body.error?.code ?? body.error?.type;
    return typeof code === 'string' ? code.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 100) : '';
  } catch {
    return '';
  }
}

export async function generateChatReply(
  messages: LlmMessage[],
  fetcher: typeof fetch = fetch,
  groqGenerator: GroqGenerator = generateGroqResponse,
): Promise<string> {
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
    if (!response.ok) {
      const code = await providerErrorCode(response);
      console.error(`[ChatAI] Provider returned HTTP ${response.status}${code ? ` (${code})` : ''}.`);
      if (response.status === 404) {
        throw new ChatError(503, 'Không tìm thấy model AI. Vui lòng kiểm tra cấu hình model.');
      }
      if (response.status === 401 || response.status === 403 || response.status === 429) {
        console.warn(`[ChatAI] Gemini unavailable (HTTP ${response.status}); attempting Groq fallback.`);
        try {
          const fallbackReply = await groqGenerator(messages);
          if (!fallbackReply.trim() || fallbackReply.length > 11000) {
            throw new Error('Groq returned an invalid response.');
          }
          return fallbackReply.trim();
        } catch (error) {
          const status = typeof error === 'object' && error !== null && 'status' in error
            && typeof error.status === 'number'
            ? error.status
            : undefined;
          console.error(`[ChatAI] Groq fallback failed${status ? ` with HTTP ${status}` : '.'}`);
          throw new ChatError(503, 'Gemini không khả dụng và AI dự phòng Groq chưa thể phản hồi. Vui lòng thử lại sau.');
        }
      }
      if (response.status === 401 || response.status === 403) {
        throw new ChatError(503, 'Dịch vụ AI chưa được cấp quyền. Vui lòng kiểm tra API key và quyền truy cập model.');
      }
      if (response.status === 400) {
        throw new ChatError(502, 'Dịch vụ AI từ chối yêu cầu. Vui lòng kiểm tra cấu hình model hoặc thử rút gọn câu hỏi.');
      }
      throw new ChatError(502, 'Dịch vụ AI chưa thể phản hồi. Vui lòng gửi lại.');
    }
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
