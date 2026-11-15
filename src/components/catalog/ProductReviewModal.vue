<script setup lang="ts">
import { ref, watch } from 'vue';
import { Star, X } from 'lucide-vue-next';
import { useToastStore } from '../../stores/toastStore';

const props = defineProps<{
  modelValue: boolean;
  productName?: string;
  authorName?: string;
  submitting?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', payload: { rating: number; content: string }): void;
}>();

const toastStore = useToastStore();

const rating = ref(5);

const content = ref('');

watch(() => props.modelValue, (open) => {
  if (open) { rating.value = 5; content.value = ''; }
});

function closeModal() {
  if (props.submitting) return;
  emit('update:modelValue', false);
}

function handleSubmit() {
  if (props.submitting) return;
  if (!content.value.trim()) {
    toastStore.show('Vui lòng nhập nội dung đánh giá');
    return;
  }

  emit('submit', {
    rating: rating.value,
    content: content.value.trim(),
  });


}
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
    @click.self="closeModal"
  >
    <div class="bg-white w-full max-w-lg rounded-xl p-4 sm:p-8 space-y-5 shadow-2xl border border-[#CCD7BC] animate-in fade-in zoom-in-95 duration-200">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-[#ECEFE7] pb-4">
        <div>
          <h3 class="font-heading text-xl font-bold text-[#242424]">Đánh giá sản phẩm</h3>
          <p v-if="productName" class="text-xs text-[#7A866E] truncate max-w-xs sm:max-w-sm mt-0.5">
            {{ productName }}
          </p>
        </div>
        <button
          type="button"
          @click="closeModal"
          class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#FAF9F5] text-[#7A866E] transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Form Body -->
      <div class="space-y-4">
        <!-- Chọn số sao -->
        <div class="space-y-1.5 text-center">
          <span class="text-xs font-bold text-[#7A866E] uppercase tracking-wider">Mức độ hài lòng của bạn</span>
          <div class="flex justify-center gap-2 pt-1">
            <button
              v-for="s in 5"
              :key="s"
              type="button"
              @click="rating = s"
              class="p-1 cursor-pointer transition-transform hover:scale-125"
            >
              <Star
                class="w-7 h-7"
                :class="s <= rating ? 'fill-[#E8A020] text-[#E8A020]' : 'text-stone-300'"
              />
            </button>
          </div>
        </div>

        <!-- Nhận xét -->
        <div class="space-y-1">
          <label class="text-xs font-bold text-[#242424] block">Nội dung đánh giá</label>
          <textarea
            v-model="content"
            rows="4"
            maxlength="2000"
            :disabled="submitting"
            placeholder="Hãy chia sẻ cảm nhận của bạn về hương vị, bao bì và tác dụng dinh dưỡng của sản phẩm..."
            class="w-full px-4 py-2.5 rounded-xl border border-[#CCD7BC] text-sm focus:outline-none focus:border-[#4D6A34] focus:ring-1 focus:ring-[#4D6A34]"
          ></textarea>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="flex items-center justify-end gap-3 pt-2 border-t border-[#ECEFE7]">
        <button
          type="button"
          @click="closeModal"
          class="px-5 py-2.5 rounded-xl text-xs font-bold text-[#7A866E] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
        >
          Hủy
        </button>
        <button
          type="button"
          @click="handleSubmit"
          :disabled="submitting"
          class="px-6 py-2.5 rounded-xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          {{ submitting ? 'Đang gửi...' : 'Gửi đánh giá' }}
        </button>
      </div>
    </div>
  </div>
</template>

