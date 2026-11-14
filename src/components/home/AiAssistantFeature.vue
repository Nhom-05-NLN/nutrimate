<script setup lang="ts">
import { useChatStore } from '../../stores/chatStore';
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  ImagePlus,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  X,
} from 'lucide-vue-next';

const chatStore = useChatStore();
</script>

<template>
  <section class="w-full bg-[#AEB78B] py-16">
    <div class="max-w-[1316px] mx-auto px-4 sm:px-8">
      <!-- Container to mau Trang Mint (Figma 01) -->
      <div class="rounded-4xl bg-[#F7FBF4] border border-[#CCD7BC] p-8 sm:p-12 lg:p-16 shadow-xl">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <!-- Cột Trái: Thông điệp AI -->
          <div class="lg:col-span-6 space-y-6">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#3B4E24] text-xs font-bold border border-[#C8D7BE]">
              <span class="w-2 h-2 rounded-full bg-[#6B7A3A]"></span>
              <span>NutriBot Trợ Lý 24/7</span>
            </div>

            <h2 class="font-heading text-2xl sm:text-4xl font-black text-[#242424] leading-tight">
              Chuyên gia dinh dưỡng AI luôn đồng hành cùng bạn
            </h2>

            <p class="text-sm text-[#576449] leading-relaxed">
              Đang phân vân không biết ăn gì trước buổi tập? Cần thực đơn 1.500 kcal chuẩn cho cả tuần? Hãy hỏi ngay NutriBot để nhận giải pháp tức thì.
            </p>

            <div class="space-y-3 pt-2">
              <div class="flex items-center gap-3 text-xs sm:text-sm font-semibold text-[#242424]">
                <CheckCircle2 class="w-5 h-5 text-[#6B7A3A] shrink-0" />
                <span>Tự động cân đối Macro theo số đo cơ thể</span>
              </div>
              <div class="flex items-center gap-3 text-xs sm:text-sm font-semibold text-[#242424]">
                <CheckCircle2 class="w-5 h-5 text-[#6B7A3A] shrink-0" />
                <span>Gợi ý giỏ hàng thông minh đúng lượng calo</span>
              </div>
            </div>

            <div class="pt-2">
              <button
                type="button"
                @click="chatStore.openChat()"
                class="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] hover:shadow-lg text-white font-bold text-sm shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8EA675] focus-visible:ring-offset-2"
              >
                <MessageSquare class="w-4 h-4" />
                <span>Trò chuyện ngay với NutriBot</span>
              </button>
            </div>
          </div>

          <!-- Cột Phải: Xem trước giao diện NutriBot khi mở hội thoại mới -->
          <div class="lg:col-span-6">
            <div class="overflow-hidden rounded-3xl border border-[#DCE4D2] bg-white shadow-xl">
              <div class="flex items-center justify-between bg-[#3B4E24] px-4 py-3.5 text-white sm:px-5">
                <div class="flex min-w-0 items-center gap-3">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#647C47] bg-[#4D6A34] text-[#EBF1E6]">
                    <Bot class="h-5 w-5" />
                  </div>
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-1.5">
                      <h4 class="font-heading text-sm font-bold text-white">NutriBot AI Consultant</h4>
                      <span class="inline-flex items-center gap-1 rounded-full bg-[#5A733E] px-1.5 py-0.5 text-[10px] font-semibold text-emerald-100">
                        <Sparkles class="h-2.5 w-2.5" /> v2.5
                      </span>
                    </div>
                    <p class="flex items-center gap-1 text-[10px] text-[#DCE7D0] sm:text-[11px]">
                      <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      Đang trực tuyến • Chuyên gia cá nhân hóa dinh dưỡng
                    </p>
                  </div>
                </div>
                <div class="ml-2 hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[#DCE7D0] sm:flex">
                  <span class="sr-only">Đóng khung chat</span>
                  <X aria-hidden="true" class="h-5 w-5" />
                </div>
              </div>

              <div class="flex items-center gap-2 border-b border-[#E3E8DC] bg-white px-4 py-2.5">
                <div class="relative min-w-0 flex-1">
                  <div class="flex items-center justify-between rounded-xl border border-[#E3E8DC] bg-[#FAF9F5] py-2 pl-3 pr-2 text-xs font-semibold text-[#344625]">
                    <span>Hội thoại mới</span>
                    <ChevronDown class="h-4 w-4 text-[#71805F]" />
                  </div>
                </div>
                <div class="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#4D6A34] px-3 text-xs font-semibold text-white shadow-sm">
                  <Plus class="h-4 w-4" />
                  <span>Chat mới</span>
                </div>
              </div>

              <div class="flex min-h-[260px] flex-col bg-[#FAF9F5] p-4 sm:min-h-[300px] sm:p-5">
                <div class="flex items-start gap-2">
                  <div class="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#EBF1E6] text-[#4D6A34]">
                    <Bot class="h-4 w-4" />
                  </div>
                  <div class="max-w-[95%] rounded-2xl rounded-tl-xs border border-[#E3E8DC] bg-white p-3.5 text-xs leading-relaxed text-[#2D3B1E] shadow-xs sm:text-sm">
                    Chào bạn! Mình là NutriBot. Bạn muốn tìm hiểu về sản phẩm hay dinh dưỡng? Thông tin chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ hoặc chuyên gia dinh dưỡng.
                  </div>
                </div>
              </div>

              <div class="flex gap-1.5 overflow-hidden border-t border-[#ECEFE7] bg-white px-4 py-2">
                <span class="shrink-0 rounded-full border border-[#DEE5D4] bg-[#F3F6EE] px-2.5 py-1 text-[10px] font-medium text-[#556345]">
                  Gợi ý món giàu protein, ít đường
                </span>
                <span class="shrink-0 rounded-full border border-[#DEE5D4] bg-[#F3F6EE] px-2.5 py-1 text-[10px] font-medium text-[#556345]">
                  Tìm món ít calo cho bữa tối
                </span>
              </div>

              <div class="flex items-center gap-2 border-t border-[#ECEFE7] bg-white p-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#DEE5D4] bg-white text-[#4D6A34]">
                  <ImagePlus class="h-4 w-4" />
                </div>
                <div class="flex h-10 min-w-0 flex-1 items-center rounded-xl border border-[#DEE5D4] bg-[#FAF9F5] px-3.5 text-xs text-[#8C9882] sm:text-sm">
                  Hỏi về calo, đạm, thực đơn giảm cân...
                </div>
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4D6A34] text-white">
                  <Send class="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
