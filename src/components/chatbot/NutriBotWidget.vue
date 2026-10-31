<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { useChatStore } from '../../stores/chatStore';
import { useCartStore } from '../../stores/cartStore';
import { useProductStore } from '../../stores/productStore';
import { ChatSuggestedProduct, Product } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import {
  Bot,
  X,
  Send,
  Sparkles,
  ShoppingBag,
  ImagePlus,
} from 'lucide-vue-next';

const chatStore = useChatStore();
const authStore = useAuthStore();
const toastStore = useToastStore();
const chatBlocked = computed(() => chatStore.isThinking || chatStore.requiresAuthentication || chatStore.guestSessionExpired);
const cartStore = useCartStore();
const productStore = useProductStore();

const inputText = ref('');
const messagesContainer = ref<HTMLDivElement | null>(null);
const imageInput = ref<HTMLInputElement | null>(null);
const maxNutritionImageBytes = 5 * 1024 * 1024;
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

const quickPrompts = [
  'Tôi muốn giảm cân nhưng hay đói vặt tầm 4h chiều',
  'Tính chỉ số TDEE & Macro hôm nay',
  'Gợi ý bữa tối dưới 400 kcal',
  'Tư vấn món ăn kèm Granola',
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
  if (inputText.value.trim() && !chatBlocked.value) {
    const txt = inputText.value;
    inputText.value = '';
    chatStore.sendMessage(txt);
  }
}

function handleQuickPrompt(promptText: string) {
  chatStore.sendMessage(promptText);
}

function handleImageSelected(event: Event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  if (file.size > maxNutritionImageBytes) {
    toastStore.show('Ảnh vượt quá dung lượng tối đa 5 MB.', 'error');
    return;
  }
  if (file.type && !allowedImageTypes.includes(file.type)) {
    toastStore.show('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.', 'error');
    return;
  }
  void chatStore.analyzeImage(file);
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function handleAddToCartFromChat(product: Product) {
  cartStore.addItem(product, 1);
}

function hasNutritionFacts(product: ChatSuggestedProduct): product is Product {
  return product.nutrition !== undefined;
}

function openSuggestedProduct(product: ChatSuggestedProduct) {
  if (hasNutritionFacts(product)) productStore.selectProduct(product);
}
</script>

<template>
  <div>
    <!-- Floating Trigger Button -->
    <button
      v-if="!chatStore.isOpen"
      type="button"
      @click="chatStore.openChat()"
      class="fixed bottom-6 right-6 z-40 bg-[#4D6A34] hover:bg-[#3B4E24] text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 transition-all hover:scale-105 group border border-white/20 min-h-[44px]"
      title="NutriBot AI - Tư vấn thực đơn & Macros"
      aria-label="Mở tư vấn NutriBot AI"
    >
      <div class="relative">
        <Bot class="w-5 h-5 text-[#EBF1E6]" />
        <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping"></span>
        <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-300"></span>
      </div>
      <div class="flex flex-col text-left">
        <span class="text-xs font-bold font-heading text-white flex items-center gap-1.5">
          NutriBot AI
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
        </span>
        <span class="text-[10px] text-[#DCE7D0]">Tư vấn thực đơn & Macros</span>
      </div>
    </button>

    <!-- Chat Modal / Drawer Widget -->
    <div
      v-if="chatStore.isOpen"
      class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-[#E3E8DC] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
      role="dialog"
      aria-modal="true"
    >
      <!-- Chat Header -->
      <div class="p-4 bg-[#3B4E24] text-white flex items-center justify-between shadow-xs">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-[#4D6A34] border border-[#647C47] flex items-center justify-center text-[#EBF1E6]">
            <Bot class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <h3 class="font-heading text-sm font-bold text-white">NutriBot AI Consultant</h3>
              <span class="px-1.5 py-0.5 rounded-full bg-[#5A733E] text-[10px] font-semibold text-emerald-100 flex items-center gap-1">
                <Sparkles class="w-2.5 h-2.5" /> v2.4
              </span>
            </div>
            <p class="text-[11px] text-[#DCE7D0] flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Đang trực tuyến • Chuyên gia cá nhân hóa dinh dưỡng
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="chatStore.closeChat()"
          class="w-8 h-8 rounded-xl text-[#DCE7D0] hover:text-white hover:bg-[#4D6A34] flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
          aria-label="Đóng khung chat"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Messages Stream -->
      <div class="px-4 py-2 flex gap-2 border-b border-[#E3E8DC] text-xs">
        <select :value="chatStore.conversationId || ''" :disabled="chatBlocked" aria-label="Chọn hội thoại" class="flex-1 min-w-0" @change="chatStore.selectConversation(($event.target as HTMLSelectElement).value)">
          <option v-for="(conversation, index) in chatStore.conversations" :key="conversation.id" :value="conversation.id">Hội thoại {{ index + 1 }} · {{ new Date(conversation.createdAt).toLocaleDateString('vi-VN') }}</option>
        </select>
        <button type="button" :disabled="chatBlocked" @click="chatStore.newConversation()">Chat mới</button>
      </div>
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF9F5]"
      >
        <button v-if="chatStore.hasEarlier" type="button" :disabled="chatBlocked" class="text-xs text-[#4D6A34] underline" @click="chatStore.loadEarlier()">Tải tin nhắn trước</button>
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
                ? 'bg-[#4D6A34] text-white rounded-tr-xs'
                : 'bg-white text-[#2D3B1E] border border-[#E3E8DC] rounded-tl-xs'
            "
          >
            <img
              v-if="msg.imagePreview"
              :src="msg.imagePreview"
              alt="Ảnh thực phẩm được gửi để phân tích"
              class="mb-2 max-h-48 max-w-full rounded-xl object-contain"
            />
            {{ msg.text }}
          </div>
          <button v-if="msg.failed" type="button" :disabled="chatBlocked" class="text-xs text-red-700 underline" @click="chatStore.retryMessage(msg)">Gửi lại tin nhắn</button>

          <!-- Suggested Products Card in Bot Reply -->
          <div
            v-if="msg.suggestedProducts && msg.suggestedProducts.length > 0"
            class="w-full max-w-[95%] space-y-2 mt-1"
          >
            <span class="text-[10px] font-bold text-[#68725F] uppercase tracking-wider block">
              Gợi ý thực phẩm phù hợp với bạn:
            </span>
            <div class="grid grid-cols-1 gap-2">
              <div
                v-for="prod in msg.suggestedProducts"
                :key="prod.id"
                class="flex items-center gap-2.5 p-2 bg-white rounded-2xl border border-[#E3E8DC] shadow-2xs hover:border-[#4D6A34] transition-all"
              >
                <img
                  :src="prod.image"
                  :alt="prod.name"
                  class="w-12 h-12 rounded-xl object-cover shrink-0 cursor-pointer"
                  @click="openSuggestedProduct(prod)"
                />
                <div class="flex-1 min-w-0" :class="hasNutritionFacts(prod) ? 'cursor-pointer' : ''" @click="openSuggestedProduct(prod)">
                  <h4 class="font-heading text-xs font-bold text-[#2D3B1E] truncate">
                    {{ prod.name }}
                  </h4>
                  <div class="flex items-center gap-2 text-[10px] text-[#68725F]">
                    <template v-if="hasNutritionFacts(prod)">
                      <span>{{ prod.nutrition.calories }} kcal</span>
                      <span>•</span>
                      <span class="text-[#4D6A34] font-semibold">{{ prod.nutrition.protein }}g đạm</span>
                    </template>
                    <span v-else>Thông tin dinh dưỡng chưa cập nhật</span>
                  </div>
                  <span class="text-xs font-bold text-[#4D6A34]">
                    {{ formatVnd(prod.price) }}
                  </span>
                </div>
                <button
                  v-if="hasNutritionFacts(prod)"
                  type="button"
                  @click="handleAddToCartFromChat(prod)"
                  class="px-2.5 py-1.5 rounded-xl bg-[#EBF1E6] hover:bg-[#4D6A34] text-[#4D6A34] hover:text-white shrink-0 transition-colors text-xs font-bold flex items-center gap-1"
                  title="Thêm vào giỏ"
                  aria-label="Thêm món này vào giỏ hàng"
                >
                  <ShoppingBag class="w-3.5 h-3.5" />
                  <span class="hidden sm:inline">Thêm</span>
                </button>
              </div>
            </div>
          </div>

          <span class="text-[10px] text-[#939D8A] px-1">{{ msg.timestamp }}</span>
        </div>

        <!-- Thinking Indicator -->
        <div v-if="chatStore.isThinking" class="flex items-center gap-2 text-[#7E8B73] text-xs py-2">
          <div class="w-7 h-7 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <Bot class="w-4 h-4 animate-spin" />
          </div>
          <span class="italic">NutriBot đang tính toán calo và dinh dưỡng...</span>
        </div>
      </div>

      <!-- Quick Prompt Suggestions -->
      <div v-if="chatStore.error" role="alert" class="px-4 py-2 bg-red-50 text-red-800 text-xs">
        {{ chatStore.error }}
        <RouterLink v-if="chatStore.requiresAuthentication || chatStore.requiresImageAuthentication" to="/login" class="underline ml-2">Đăng nhập Customer</RouterLink>
        <button v-else-if="chatStore.guestSessionExpired" type="button" :disabled="chatStore.isThinking" class="underline ml-2" @click="chatStore.restartGuestSession()">Bắt đầu phiên Guest mới</button>
        <button v-else-if="!chatStore.conversationId" type="button" :disabled="chatStore.isThinking" class="underline ml-2" @click="chatStore.initialize()">Thử kết nối lại</button>
      </div>
      <div class="px-4 py-2 border-t border-[#ECEFE7] bg-white overflow-x-auto flex gap-1.5 no-scrollbar">
        <button
          v-for="qp in quickPrompts"
          :key="qp"
          type="button"
          @click="handleQuickPrompt(qp)"
          :disabled="chatBlocked"
          class="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#F3F6EE] hover:bg-[#EBF1E6] hover:text-[#2D3B1E] text-[#556345] transition-colors border border-[#DEE5D4]"
        >
          {{ qp }}
        </button>
      </div>

      <!-- Chat Input Field -->
      <form @submit.prevent="handleSend" class="p-3 bg-white border-t border-[#ECEFE7] flex items-center gap-2">
        <input
          ref="imageInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          @change="handleImageSelected"
        />
        <button
          type="button"
          :disabled="chatBlocked"
          @click="imageInput?.click()"
          class="p-2.5 rounded-xl border border-[#DEE5D4] bg-white text-[#4D6A34] hover:bg-[#F3F6EE] disabled:opacity-40 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Tải ảnh thực phẩm để ước tính dinh dưỡng"
          :title="authStore.accessToken ? 'Phân tích ảnh thực phẩm' : 'Đăng nhập Customer để phân tích ảnh'"
        >
          <ImagePlus class="w-4 h-4" />
        </button>
        <input
          type="text"
          v-model="inputText"
          maxlength="4000"
          :disabled="chatBlocked"
          aria-label="Câu hỏi gửi NutriBot"
          placeholder="Hỏi về calo, đạm, thực đơn giảm cân..."
          class="flex-1 px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs sm:text-sm text-[#2D3B1E] placeholder-[#8C9882] focus:bg-white focus:border-[#4D6A34] outline-none"
        />
        <button
          type="submit"
          :disabled="!inputText.trim() || chatBlocked"
          class="p-2.5 rounded-xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white disabled:opacity-40 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Gửi tin nhắn"
        >
          <Send class="w-4 h-4" />
        </button>
      </form>
    </div>
  </div>
</template>
