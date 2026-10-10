<script setup lang="ts">
import { useChatStore } from '../../stores/chatStore';
import { useCartStore } from '../../stores/cartStore';
import { useToastStore } from '../../stores/toastStore';
import {
  Bot,
  CheckCircle2,
  MessageSquare,
  Sparkles,
} from 'lucide-vue-next';

const chatStore = useChatStore();
const cartStore = useCartStore();
const toastStore = useToastStore();

function handleAddAiCombo() {
  cartStore.addItem(
    {
      id: 'combo-snack-ai',
      code: 'NM-AI-SNACK',
      name: 'Combo Nhẹ Bụng 4h Chiều: 1 Hũ Sữa Chua + 25g Hạt Macca Hạnh Nhân',
      category: 'snacks-nuts',
      categoryName: 'Gợi ý NutriBot',
      price: 65000,
      image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=400&q=80',
      description: 'Combo nhẹ bụng bổ sung protein & chất xơ, calo cực thấp cho bữa xế.',
      ingredients: ['Sữa chua Hy Lạp', 'Hạt macca', 'Hạnh nhân'],
      nutrition: {
        servingSize: '1 phần',
        calories: 140,
        protein: 6,
        carbs: 8,
        fat: 9,
        sugar: 0,
      },
      stock: 99,
      rating: 5.0,
      reviewCount: 42,
      badges: ['AI Recommended', '140 kcal'],
      bestFor: 'Ăn xế văn phòng',
    },
    1,
    'Combo 1 người'
  );
  toastStore.show('Đã thêm combo AI vào giỏ hàng!', 'success', '1 Hũ Sữa Chua + 25g Hạt Macca (140 kcal)');
}
</script>

<template>
  <section class="py-12">
    <div class="rounded-4xl bg-[#EBF1E6]/70 border border-[#CCD7BC] p-6 sm:p-10 lg:p-14">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <!-- Cột Trái: Thông điệp AI -->
        <div class="lg:col-span-6 space-y-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#3B4E24] text-xs font-bold border border-[#C8D7BE]">
            <span class="w-2 h-2 rounded-full bg-[#4D6A34]"></span>
            <span>NutriBot Trợ Lý 24/7</span>
          </div>

          <h2 class="font-heading text-2xl sm:text-4xl font-black text-[#2D3B1E] leading-tight">
            Chuyên gia dinh dưỡng AI luôn đồng hành cùng bạn
          </h2>

          <p class="text-sm text-[#576449] leading-relaxed">
            Đang phân vân không biết ăn gì trước buổi tập? Cần thực đơn 1.500 kcal chuẩn cho cả tuần? Hãy hỏi ngay NutriBot để nhận giải pháp tức thì.
          </p>

          <div class="space-y-3 pt-2">
            <div class="flex items-center gap-3 text-xs sm:text-sm font-semibold text-[#2D3B1E]">
              <CheckCircle2 class="w-5 h-5 text-[#4D6A34] shrink-0" />
              <span>Tự động cân đối Macro theo số đo cơ thể</span>
            </div>
            <div class="flex items-center gap-3 text-xs sm:text-sm font-semibold text-[#2D3B1E]">
              <CheckCircle2 class="w-5 h-5 text-[#4D6A34] shrink-0" />
              <span>Gợi ý giỏ hàng thông minh đúng lượng calo</span>
            </div>
          </div>

          <div class="pt-2">
            <button
              type="button"
              @click="chatStore.openChat()"
              class="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white font-bold text-sm shadow-md transition-all"
            >
              <MessageSquare class="w-4 h-4" />
              <span>Trò chuyện ngay với NutriBot</span>
            </button>
          </div>
        </div>

        <!-- Cột Phải: Mockup Chatbox của NutriBot AI -->
        <div class="lg:col-span-6">
          <div class="bg-white rounded-3xl shadow-xl border border-[#DCE4D2] overflow-hidden">
            <!-- Header bar chatbox -->
            <div class="px-5 py-3.5 bg-[#F6F8F3] border-b border-[#E3E8DC] flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-[#4D6A34] text-white flex items-center justify-center">
                  <Bot class="w-4 h-4" />
                </div>
                <div>
                  <h4 class="font-heading text-xs font-bold text-[#2D3B1E]">NutriBot AI Consultant</h4>
                  <span class="text-[10px] text-[#7A866E] flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Đang trực tuyến
                  </span>
                </div>
              </div>
              <span class="text-[10px] text-[#7A866E]">Phiên bản 2.4</span>
            </div>

            <!-- Body messages -->
            <div class="p-5 space-y-4 text-xs">
              <!-- User message -->
              <div class="flex justify-end">
                <div class="max-w-[85%] bg-[#F0F4EA] text-[#2D3B1E] p-3.5 rounded-2xl rounded-tr-xs border border-[#CCD7BC]">
                  "Tôi muốn giảm cân nhưng hay đói vặt vào tầm 4h chiều, nên ăn món gì lành mạnh mà ít calo?"
                </div>
              </div>

              <!-- Bot response message -->
              <div class="flex items-start gap-2.5">
                <div class="w-7 h-7 rounded-lg bg-[#4D6A34] text-white flex items-center justify-center shrink-0 mt-1">
                  <Bot class="w-3.5 h-3.5" />
                </div>
                <div class="max-w-[90%] space-y-3">
                  <div class="bg-[#F8FAF5] p-3.5 rounded-2xl rounded-tl-xs border border-[#E3E8DC] text-[#2D3B1E] leading-relaxed">
                    Chào bạn! Để tránh tích mỡ nhưng vẫn no lâu vào cử xế chiều, bạn nên ưu tiên món <strong>giàu protein & chất xơ</strong>, dưới <strong>150 kcal</strong>.
                    <br /><br />
                    NutriBot gợi ý combo nhẹ bụng này:
                  </div>

                  <!-- Product recommendation card inside chat -->
                  <div class="p-3 bg-white rounded-2xl border border-[#CCD7BC] shadow-xs flex items-center justify-between gap-3">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <div class="w-9 h-9 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center shrink-0">
                        <Sparkles class="w-4 h-4" />
                      </div>
                      <div class="min-w-0">
                        <p class="font-bold text-[#2D3B1E] truncate">1 Hũ Sữa Chua + 25g Hạt Macca Hạnh Nhân</p>
                        <p class="text-[10px] text-[#6B7562]">140 kcal • 6g Protein • 0g Đường bổ sung</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      @click="handleAddAiCombo"
                      class="px-3 py-1.5 rounded-xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white font-bold text-[11px] shrink-0 transition-colors"
                    >
                      Thêm vào giỏ
                    </button>
                  </div>

                  <!-- Quick pill buttons -->
                  <div class="flex flex-wrap gap-2 pt-1">
                    <span class="px-2.5 py-1 rounded-full bg-[#EBF1E6] text-[10px] text-[#4D6A34] font-semibold border border-[#CCD7BC]">
                      Tính chỉ số TDEE của tôi
                    </span>
                    <span class="px-2.5 py-1 rounded-full bg-[#EBF1E6] text-[10px] text-[#4D6A34] font-semibold border border-[#CCD7BC]">
                      Gợi ý bữa tối dưới 400 kcal
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
