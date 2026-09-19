import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ChatMessage } from '../types';
import { postChatMessage } from '../services/api';

export const useChatStore = defineStore('chat', () => {
  const isOpen = ref<boolean>(false);
  const isThinking = ref<boolean>(false);

  const messages = ref<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: 'Chào bạn! Mình là NutriBot — Chuyên viên tư vấn dinh dưỡng của NutriMate. Mình có thể giúp bạn chọn thực phẩm Low-Carb, giàu Đạm (High-Protein) cho gymer, hay sản phẩm 0% Đường tinh luyện. Bạn đang có mục tiêu gì?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  function openChat() {
    isOpen.value = true;
  }

  function closeChat() {
    isOpen.value = false;
  }

  function toggleChat() {
    isOpen.value = !isOpen.value;
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isThinking.value) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: time,
    };
    messages.value.push(userMsg);

    isThinking.value = true;
    try {
      const res = await postChatMessage(text.trim());
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedProducts: res.suggestedProducts,
      };
      messages.value.push(botMsg);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'NutriBot đang bận, bạn thử lại sau nhé!';
      messages.value.push({
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: `Rất tiếc: ${errMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } finally {
      isThinking.value = false;
    }
  }

  return {
    isOpen,
    isThinking,
    messages,
    openChat,
    closeChat,
    toggleChat,
    sendMessage,
  };
});
