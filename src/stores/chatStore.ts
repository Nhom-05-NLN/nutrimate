import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { ChatMessage } from '../types';
import { ApiError, createChatConversation, fetchChatConversations, fetchChatHistory, postChatMessage, type ChatConversation, type ChatHistoryMessage } from '../services/api';
import { useAuthStore } from './authStore';

export const useChatStore = defineStore('chat', () => {
  const auth = useAuthStore();
  const isOpen = ref(false);
  const isThinking = ref(false);
  const error = ref('');
  const conversationId = ref<string | null>(null);
  const conversations = ref<ChatConversation[]>([]);
  const hasEarlier = ref(false);
  const welcome = (): ChatMessage => ({
    id: 'welcome', sender: 'bot', text: 'Chào bạn! Mình là NutriBot. Bạn muốn tìm hiểu về sản phẩm hay dinh dưỡng? Thông tin chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ hoặc chuyên gia dinh dưỡng.', timestamp: '',
  });
  const messages = ref<ChatMessage[]>([welcome()]);
  let epoch = 0;

  function display(message: ChatHistoryMessage): ChatMessage {
    return { id: message.id, requestId: message.requestId, sender: message.role === 'user' ? 'user' : 'bot',
      text: message.content, timestamp: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), suggestedProducts: message.suggestedProducts };
  }
  function resetIdentity() {
    epoch++;
    conversationId.value = null;
    conversations.value = [];
    messages.value = [welcome()];
    isThinking.value = false;
    hasEarlier.value = false;
    error.value = '';
  }
  watch(() => auth.accessToken, () => { resetIdentity(); if (isOpen.value) void initialize(); });

  async function initialize() {
    if (isThinking.value || conversationId.value) return;
    const active = epoch;
    const token = auth.accessToken;
    isThinking.value = true;
    error.value = '';
    try {
      let list: ChatConversation[];
      try { list = await fetchChatConversations(token); }
      catch (reason) { if (reason instanceof ApiError && reason.status === 401 && !token) list = []; else throw reason; }
      const conversation = list[0] || await createChatConversation(token);
      const history = await fetchChatHistory(conversation.id, token);
      if (active !== epoch) return;
      conversations.value = list.length ? list : [conversation];
      conversationId.value = conversation.id;
      messages.value = history.length ? history.map(display) : [welcome()];
      hasEarlier.value = history.length === 50;
    } catch (reason) { if (active === epoch) error.value = reason instanceof Error ? reason.message : 'Không tải được hội thoại.'; }
    finally { if (active === epoch) isThinking.value = false; }
  }
  async function selectConversation(id: string) {
    if (isThinking.value || !id) return;
    const active = epoch;
    isThinking.value = true;
    error.value = '';
    try {
      const history = await fetchChatHistory(id, auth.accessToken);
      if (active !== epoch) return;
      conversationId.value = id;
      messages.value = history.length ? history.map(display) : [welcome()];
      hasEarlier.value = history.length === 50;
    } catch (reason) { if (active === epoch) error.value = reason instanceof Error ? reason.message : 'Không tải được hội thoại.'; }
    finally { if (active === epoch) isThinking.value = false; }
  }
  async function newConversation() {
    if (isThinking.value) return;
    const active = epoch;
    isThinking.value = true;
    error.value = '';
    try {
      const conversation = await createChatConversation(auth.accessToken);
      if (active !== epoch) return;
      conversations.value = [conversation, ...conversations.value].slice(0, 50);
      conversationId.value = conversation.id;
      messages.value = [welcome()];
      hasEarlier.value = false;
    } catch (reason) { if (active === epoch) error.value = reason instanceof Error ? reason.message : 'Không tạo được hội thoại.'; }
    finally { if (active === epoch) isThinking.value = false; }
  }
  async function loadEarlier() {
    const first = messages.value[0];
    if (isThinking.value || !conversationId.value || !first || !hasEarlier.value) return;
    const active = epoch;
    isThinking.value = true;
    error.value = '';
    try {
      const history = await fetchChatHistory(conversationId.value, auth.accessToken, first.id);
      if (active !== epoch) return;
      messages.value.unshift(...history.map(display));
      hasEarlier.value = history.length === 50;
    } catch (reason) { if (active === epoch) error.value = reason instanceof Error ? reason.message : 'Không tải được lịch sử.'; }
    finally { if (active === epoch) isThinking.value = false; }
  }
  async function sendMessage(text: string, retryId?: string) {
    if (!text.trim() || text.trim().length > 4000 || isThinking.value) return;
    const active = epoch;
    const requestId = retryId || crypto.randomUUID();
    const userMessage = messages.value.find(message => message.sender === 'user' && message.requestId === requestId);
    if (userMessage) userMessage.failed = false;
    else messages.value.push({ id: requestId, requestId, sender: 'user', text: text.trim(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    isThinking.value = true;
    error.value = '';
    try {
      if (!conversationId.value) {
        const conversation = await createChatConversation(auth.accessToken);
        if (active !== epoch) return;
        conversationId.value = conversation.id;
        conversations.value.unshift(conversation);
      }
      const response = await postChatMessage(text.trim(), conversationId.value, requestId, auth.accessToken);
      if (active !== epoch) return;
      const index = messages.value.findIndex(message => message.sender === 'user' && message.requestId === requestId);
      if (index >= 0) messages.value.splice(index, 1, ...response.messages.map(display));
    } catch (reason) {
      if (active !== epoch) return;
      const failed = messages.value.find(message => message.sender === 'user' && message.requestId === requestId);
      if (failed) failed.failed = true;
      error.value = reason instanceof Error ? reason.message : 'NutriBot đang bận, vui lòng gửi lại.';
    } finally { if (active === epoch) isThinking.value = false; }
  }
  function retryMessage(message: ChatMessage) { if (message.failed && message.requestId) void sendMessage(message.text, message.requestId); }
  function openChat() { isOpen.value = true; void initialize(); }
  function closeChat() { isOpen.value = false; }
  function toggleChat() { if (isOpen.value) closeChat(); else openChat(); }
  return { isOpen, isThinking, messages, error, conversationId, conversations, hasEarlier, openChat, closeChat, toggleChat,
    sendMessage, retryMessage, initialize, selectConversation, newConversation, loadEarlier };
});
