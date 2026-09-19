<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useChatStore } from '../../stores/chatStore';
import { useCartStore } from '../../stores/cartStore';
import { useProductStore } from '../../stores/productStore';
import { Product } from '../../types';
import {
  Bot,
  X,
  Send,
  Sparkles,
  ShoppingBag,
  Flame,
  Dumbbell,
  CandyOff,
} from 'lucide-vue-next';

const chatStore = useChatStore();
const cartStore = useCartStore();
const productStore = useProductStore();

const inputText = ref('');
const messagesContainer = ref<HTMLDivElement | null>(null);

const quickPrompts = [
  'Thực đơn Low-Carb giảm mỡ',
  'Thực phẩm giàu đạm cho gymer',
  'Món ngọt 0g đường tinh luyện',
  'Tôi 65kg, 1m70 muốn siết mỡ',
];

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

watch(
  () => chatStore.messages.length,
  () => {
    scrollToBottom();
  }
);

function handleSend() {
  if (inputText.value.trim()) {
    const txt = inputText.value;
    inputText.value = '';
    chatStore.sendMessage(txt);
  }
}

function handleQuickPrompt(promptText: string) {
  chatStore.sendMessage(promptText);
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function handleAddToCartFromChat(product: Product) {
  cartStore.addItem(product, 1);
}
</script>

<template>
  <div>
    <!-- Floating Trigger Button -->
    <button
      v-if="!chatStore.isOpen"
      type="button"
      @click="chatStore.openChat()"
      class="fixed bottom-6 right-6 z-40 bg-emerald-800 hover:bg-emerald-900 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-3xl shadow-2xl shadow-emerald-900/40 flex items-center gap-3 transition-all hover:scale-105 group border border-emerald-600/40 min-h-[44px]"
      title="Mở trợ lý ảo NutriBot AI tư vấn ăn kiêng"
      aria-label="Mở tư vấn NutriBot AI"
    >
      <div class="relative">
        <Bot class="w-6 h-6 text-emerald-300" />
        <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
        <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
      </div>
      <div class="hidden sm:flex flex-col text-left">
        <span class="text-xs font-bold font-heading text-white flex items-center gap-1">
          NutriBot AI
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        </span>
        <span class="text-[11px] text-emerald-200">Tư vấn dinh dưỡng</span>
      </div>
    </button>

    <!-- Chat Modal / Drawer Widget -->
    <div
      v-if="chatStore.isOpen"
      class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300"
      role="dialog"
      aria-modal="true"
    >
      <!-- Chat Header -->
      <div class="p-4 bg-emerald-900 text-white flex items-center justify-between shadow-xs">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-emerald-800/90 border border-emerald-600/50 flex items-center justify-center text-emerald-300">
            <Bot class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <h3 class="font-heading text-sm font-bold text-white">NutriBot AI</h3>
              <span class="px-1.5 py-0.5 rounded-full bg-emerald-700 text-[10px] font-semibold text-emerald-200 flex items-center gap-1">
                <Sparkles class="w-2.5 h-2.5" /> AI
              </span>
            </div>
            <p class="text-[11px] text-emerald-300 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Trực tuyến • Tư vấn thực phẩm khoa học
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="chatStore.closeChat()"
          class="w-8 h-8 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-800 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
          aria-label="Đóng khung chat"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Messages Stream -->
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
      >
        <div
          v-for="msg in chatStore.messages"
          :key="msg.id"
          class="flex flex-col gap-1.5"
          :class="msg.sender === 'user' ? 'items-end' : 'items-start'"
        >
          <!-- Message Bubble -->
          <div
            class="max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs"
            :class="
              msg.sender === 'user'
                ? 'bg-emerald-700 text-white rounded-tr-xs'
                : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
            "
          >
            {{ msg.text }}
          </div>

          <!-- Suggested Products Card in Bot Reply -->
          <div
            v-if="msg.suggestedProducts && msg.suggestedProducts.length > 0"
            class="w-full max-w-[95%] space-y-2 mt-1"
          >
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Món ăn đề xuất phù hợp:
            </span>
            <div class="grid grid-cols-1 gap-2">
              <div
                v-for="prod in msg.suggestedProducts"
                :key="prod.id"
                class="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-emerald-200/80 shadow-xs hover:border-emerald-400 transition-all"
              >
                <img
                  :src="prod.image"
                  :alt="prod.name"
                  class="w-12 h-12 rounded-lg object-cover shrink-0 cursor-pointer"
                  @click="productStore.selectProduct(prod)"
                />
                <div class="flex-1 min-w-0 cursor-pointer" @click="productStore.selectProduct(prod)">
                  <h4 class="font-heading text-xs font-bold text-slate-900 truncate">
                    {{ prod.name }}
                  </h4>
                  <div class="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>{{ prod.nutrition.calories }} kcal</span>
                    <span>•</span>
                    <span class="text-emerald-700 font-semibold">{{ prod.nutrition.protein }}g đạm</span>
                  </div>
                  <span class="text-xs font-bold text-emerald-800">
                    {{ formatVnd(prod.price) }}
                  </span>
                </div>
                <button
                  type="button"
                  @click="handleAddToCartFromChat(prod)"
                  class="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 shrink-0 transition-colors"
                  title="Thêm vào giỏ"
                  aria-label="Thêm món này vào giỏ hàng"
                >
                  <ShoppingBag class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <span class="text-[10px] text-slate-400 px-1">{{ msg.timestamp }}</span>
        </div>

        <!-- Thinking Indicator -->
        <div v-if="chatStore.isThinking" class="flex items-center gap-2 text-slate-400 text-xs py-2">
          <div class="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Bot class="w-4 h-4 animate-spin" />
          </div>
          <span class="italic">NutriBot đang phân tích dinh dưỡng...</span>
        </div>
      </div>

      <!-- Quick Prompt Suggestions -->
      <div class="px-4 py-2 border-t border-slate-100 bg-white overflow-x-auto flex gap-1.5 no-scrollbar">
        <button
          v-for="qp in quickPrompts"
          :key="qp"
          type="button"
          @click="handleQuickPrompt(qp)"
          class="shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 transition-colors border border-slate-200/60"
        >
          {{ qp }}
        </button>
      </div>

      <!-- Chat Input Field -->
      <form @submit.prevent="handleSend" class="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          v-model="inputText"
          placeholder="Hỏi về calo, đạm, keto, ăn kiêng..."
          class="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden"
        />
        <button
          type="submit"
          :disabled="!inputText.trim() || chatStore.isThinking"
          class="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-40 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Gửi tin nhắn"
        >
          <Send class="w-4 h-4" />
        </button>
      </form>
    </div>
  </div>
</template>
