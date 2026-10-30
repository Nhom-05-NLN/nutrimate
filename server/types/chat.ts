import type { Product } from './index.js';

export type ChatOwner = { userId: number; guestHash: null } | { userId: null; guestHash: string };
export interface Conversation { id: string; createdAt: string; updatedAt: string }
export interface StoredChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  requestId: string;
  suggestedProducts: Product[];
}
export interface ChatTurn {
  conversationId: string;
  reply: string;
  suggestedProducts: Product[];
  messages: StoredChatMessage[];
}
export class ChatError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const CHAT_DISCLAIMER = 'Thông tin chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ hoặc chuyên gia dinh dưỡng.';
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
