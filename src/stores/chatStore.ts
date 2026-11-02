import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { ChatMessage } from '../types';
import { ApiError, ensureChatSession, createChatConversation, fetchChatConversations, fetchChatHistory, postChatMessage, postNutritionImage, type ChatConversation, type ChatHistoryMessage } from '../services/api';
import { useAuthStore } from './authStore';

export const useChatStore = defineStore('chat', () => {
  const auth = useAuthStore();
  const isOpen = ref(false);
  const isThinking = ref(false);
  const error = ref('');
  const requiresAuthentication = ref(false);
  const requiresImageAuthentication = ref(false);
  const guestSessionExpired = ref(false);
  const conversationId = ref<string | null>(null);
  const conversations = ref<ChatConversation[]>([]);
  const hasEarlier = ref(false);
  const welcome = (): ChatMessage => ({
    id: 'welcome', sender: 'bot', text: 'Chào bạn! Mình là NutriBot. Bạn muốn tìm hiểu về sản phẩm hay dinh dưỡng? Thông tin chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ hoặc chuyên gia dinh dưỡng.', timestamp: '',
  });
  const messages = ref<ChatMessage[]>([welcome()]);
  let epoch = 0;
  let sessionReady = false;

  function display(message: ChatHistoryMessage): ChatMessage {
    return { id: message.id, requestId: message.requestId, sender: message.role === 'user' ? 'user' : 'bot',
      text: message.content, timestamp: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), suggestedProducts: message.suggestedProducts };
  }
  function disposeImagePreviews() {
    for (const message of messages.value) {
      if (message.imagePreview) URL.revokeObjectURL(message.imagePreview);
    }
  }
  function resetIdentity() {
    epoch++;
    sessionReady = false;
    requiresAuthentication.value = false;
    requiresImageAuthentication.value = false;
    guestSessionExpired.value = false;
    conversationId.value = null;
    conversations.value = [];
    disposeImagePreviews();
    messages.value = [welcome()];
    isThinking.value = false;
    hasEarlier.value = false;
    error.value = '';
  }
  watch(() => auth.accessToken, () => { resetIdentity(); if (isOpen.value) void initialize(); });

  function reportError(reason: unknown, fallback: string) {
    if (reason instanceof ApiError && reason.status === 401) {
      sessionReady = false;
      if (auth.accessToken) {
        requiresAuthentication.value = true;
        error.value = 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại để tiếp tục hội thoại của bạn.';
      } else {
        guestSessionExpired.value = true;
        error.value = 'Phiên Guest đã hết hạn hoặc không còn cookie. Hãy bắt đầu phiên Guest mới; lịch sử cũ sẽ không chuyển sang phiên mới.';
      }
    } else error.value = reason instanceof Error ? reason.message : fallback;
  }
  async function prepareSession(token: string | null, active: number) {
    const session = await ensureChatSession(token);
    if (active !== epoch) return false;
    if (!token && session.created && conversationId.value) {
      reportError(new ApiError(401, ''), '');
      return false;
    }
    sessionReady = true;
    return true;
  }
  async function restartGuestSession() {
    if (auth.accessToken || isThinking.value) return;
    resetIdentity();
    await initialize();
  }

  async function initialize() {
    if (isThinking.value || requiresAuthentication.value || guestSessionExpired.value) return;
    const active = epoch;
    const token = auth.accessToken;
    isThinking.value = true;
    error.value = '';
    try {
      if (!await prepareSession(token, active)) return;
      const list = await fetchChatConversations(token);
      if (active !== epoch) return;
      const conversation = list.find(item => item.id === conversationId.value) || list[0] || await createChatConversation(token);
      const history = await fetchChatHistory(conversation.id, token);
      if (active !== epoch) return;
      const savedRequests = new Set(history.map(message => message.requestId));
      const unsent = conversationId.value === conversation.id ? messages.value.filter(message => message.failed && !savedRequests.has(message.requestId || '')) : [];
      conversations.value = list.length ? list : [conversation];
      conversationId.value = conversation.id;
      disposeImagePreviews();
      messages.value = [...(history.length ? history.map(display) : [welcome()]), ...unsent];
      hasEarlier.value = history.length === 50;
    } catch (reason) { if (active === epoch) reportError(reason, 'Không tải được hội thoại.'); }
    finally { if (active === epoch) isThinking.value = false; }
  }
  async function selectConversation(id: string) {
    if (isThinking.value || requiresAuthentication.value || guestSessionExpired.value || !id) return;
    const active = epoch;
    isThinking.value = true;
    error.value = '';
    try {
      const history = await fetchChatHistory(id, auth.accessToken);
      if (active !== epoch) return;
      disposeImagePreviews();
      conversationId.value = id;
      messages.value = history.length ? history.map(display) : [welcome()];
      hasEarlier.value = history.length === 50;
    } catch (reason) { if (active === epoch) reportError(reason, 'Không tải được hội thoại.'); }
    finally { if (active === epoch) isThinking.value = false; }
  }
  async function newConversation() {
    if (isThinking.value || requiresAuthentication.value || guestSessionExpired.value) return;
    const active = epoch;
    isThinking.value = true;
    error.value = '';
    try {
      if (!await prepareSession(auth.accessToken, active)) return;
      const conversation = await createChatConversation(auth.accessToken);
      if (active !== epoch) return;
      conversations.value = [conversation, ...conversations.value].slice(0, 50);
      conversationId.value = conversation.id;
      disposeImagePreviews();
      messages.value = [welcome()];
      hasEarlier.value = false;
    } catch (reason) { if (active === epoch) reportError(reason, 'Không tạo được hội thoại.'); }
    finally { if (active === epoch) isThinking.value = false; }
  }
  async function loadEarlier() {
    const first = messages.value[0];
    if (isThinking.value || requiresAuthentication.value || guestSessionExpired.value || !conversationId.value || !first || !hasEarlier.value) return;
    const active = epoch;
    isThinking.value = true;
    error.value = '';
    try {
      const history = await fetchChatHistory(conversationId.value, auth.accessToken, first.id);
      if (active !== epoch) return;
      messages.value.unshift(...history.map(display));
      hasEarlier.value = history.length === 50;
    } catch (reason) { if (active === epoch) reportError(reason, 'Không tải được lịch sử.'); }
    finally { if (active === epoch) isThinking.value = false; }
  }
  async function sendMessage(text: string, retryId?: string) {
    if (!text.trim() || text.trim().length > 4000 || isThinking.value || requiresAuthentication.value || guestSessionExpired.value) return;
    const active = epoch;
    const requestId = retryId || crypto.randomUUID();
    const userMessage = messages.value.find(message => message.sender === 'user' && message.requestId === requestId);
    if (userMessage) userMessage.failed = false;
    else messages.value.push({ id: requestId, requestId, sender: 'user', text: text.trim(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    isThinking.value = true;
    error.value = '';
    requiresImageAuthentication.value = false;
    try {
      if (!sessionReady && !await prepareSession(auth.accessToken, active)) return;
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
      reportError(reason, 'NutriBot đang bận, vui lòng gửi lại.');
    } finally { if (active === epoch) isThinking.value = false; }
  }
  function retryMessage(message: ChatMessage) { if (message.failed && message.requestId) void sendMessage(message.text, message.requestId); }
  async function analyzeImage(file: File) {
    if (isThinking.value || requiresAuthentication.value || guestSessionExpired.value) return;
    if (!auth.accessToken) {
      requiresImageAuthentication.value = true;
      error.value = 'Đăng nhập Customer để phân tích ảnh thực phẩm.';
      return;
    }

    const active = epoch;
    messages.value.push({
      id: `image-${crypto.randomUUID()}`,
      sender: 'user',
      text: 'Phân tích ảnh thực phẩm',
      imagePreview: URL.createObjectURL(file),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    isThinking.value = true;
    error.value = '';
    requiresImageAuthentication.value = false;
    try {
      const result = await postNutritionImage(file, auth.accessToken);
      if (active !== epoch) return;
      const disclaimer = 'Thông tin chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ hoặc chuyên gia dinh dưỡng.';
      const text = result.status === 'unrecognized'
        ? `Mình chưa nhận diện được thực phẩm trong ảnh.${result.ocrText ? `\nNội dung đọc được: ${result.ocrText}` : ''}\n\n${disclaimer}`
        : [
            'Ước tính dinh dưỡng cho khẩu phần nhận diện được:',
            `Calories: ${result.predictedCalories ?? '—'} kcal`,
            `Protein: ${result.predictedProtein ?? '—'} g`,
            `Carbs: ${result.predictedCarbs ?? '—'} g`,
            `Fat: ${result.predictedFat ?? '—'} g`,
            `Sugar: ${result.predictedSugar ?? '—'} g`,
            result.ocrText ? `Nội dung đọc được: ${result.ocrText}` : '',
            '',
            disclaimer,
          ].filter(Boolean).join('\n');
      messages.value.push({
        id: `image-result-${result.imageId}`,
        sender: 'bot',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } catch (reason) {
      if (active !== epoch) return;
      reportError(reason, 'Không thể phân tích ảnh.');
      messages.value.push({
        id: `image-error-${Date.now()}`,
        sender: 'bot',
        text: reason instanceof Error ? reason.message : 'Không thể phân tích ảnh. Vui lòng thử lại.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } finally {
      if (active === epoch) isThinking.value = false;
    }
  }
  function openChat() { isOpen.value = true; void initialize(); }
  function closeChat() { isOpen.value = false; }
  function toggleChat() { if (isOpen.value) closeChat(); else openChat(); }
  function askAboutOrder(orderCode: string) {
    openChat();
    void sendMessage(`NutriBot ơi, kiểm tra giúp mình tiến độ đơn hàng #${orderCode} nhé!`);
  }

  return {
    isOpen,
    isThinking,
    messages,
    error,
    requiresAuthentication,
    requiresImageAuthentication,
    guestSessionExpired,
    restartGuestSession,
    conversationId,
    conversations,
    hasEarlier,
    openChat,
    closeChat,
    toggleChat,
    sendMessage,
    retryMessage,
    analyzeImage,
    initialize,
    selectConversation,
    newConversation,
    loadEarlier,
    askAboutOrder,
  };
});
