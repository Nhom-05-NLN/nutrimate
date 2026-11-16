<script setup lang="ts">
import { ref } from 'vue';
import { ArrowLeft, ArrowRight, Loader2, Trash2, UploadCloud } from 'lucide-vue-next';
import { uploadImageToCloudinary } from '../../services/cloudinary';

const props = defineProps<{ modelValue: string[]; disabled?: boolean }>();
const emit = defineEmits<{
  (event: 'update:modelValue', images: string[]): void;
  (event: 'uploading', value: boolean): void;
}>();
const input = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const error = ref('');
const imageUrl = ref('');
const dragging = ref(false);

async function upload(files: File[]) {
  if (props.disabled || uploading.value || !files.length) return;
  error.value = '';
  if (props.modelValue.length + files.length > 20) {
    error.value = 'Mỗi sản phẩm có tối đa 20 ảnh.';
    return;
  }
  uploading.value = true;
  emit('uploading', true);
  const images = [...props.modelValue];
  const failures: string[] = [];
  try {
    for (const file of files) {
      try {
        const result = await uploadImageToCloudinary(file);
        if (!images.includes(result.secureUrl)) images.push(result.secureUrl);
        emit('update:modelValue', [...images]);
      } catch (err) {
        failures.push(`${file.name}: ${err instanceof Error ? err.message : 'Không thể tải ảnh.'}`);
      }
    }
    error.value = failures.join('\n');
  } finally {
    uploading.value = false;
    emit('uploading', false);
    if (input.value) input.value.value = '';
  }
}

function change(event: Event) {
  void upload(Array.from((event.target as HTMLInputElement).files ?? []));
}
function drop(event: DragEvent) {
  dragging.value = false;
  void upload(Array.from(event.dataTransfer?.files ?? []));
}
function move(index: number, offset: number) {
  if (props.disabled || uploading.value) return;
  const images = [...props.modelValue];
  const target = index + offset;
  if (target < 0 || target >= images.length) return;
  [images[index], images[target]] = [images[target]!, images[index]!];
  emit('update:modelValue', images);
}
function remove(index: number) {
  if (!props.disabled && !uploading.value) emit('update:modelValue', props.modelValue.filter((_, i) => i !== index));
}
function addUrl() {
  if (props.disabled || uploading.value) return;
  error.value = '';
  const url = imageUrl.value.trim();
  try {
    if (!['http:', 'https:'].includes(new URL(url).protocol) || url.length > 2000) throw new Error();
    if (props.modelValue.length >= 20) { error.value = 'Mỗi sản phẩm có tối đa 20 ảnh.'; return; }
    emit('update:modelValue', [...new Set([...props.modelValue, url])]);
    imageUrl.value = '';
  } catch { error.value = 'Nhập đường dẫn ảnh HTTP hoặc HTTPS hợp lệ.'; }
}
</script>

<template>
  <div class="space-y-3">
    <p class="font-bold text-[#2D3B1E]">Hình ảnh sản phẩm ({{ modelValue.length }}/20)</p>
    <div v-if="modelValue.length" class="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[min(36dvh,22rem)] overflow-y-auto overscroll-contain pr-1">
      <div v-for="(url, index) in modelValue" :key="url" class="rounded-xl border border-[#DEE5D4] bg-[#FAF9F5] overflow-hidden">
        <img :src="url" :alt="`Ảnh sản phẩm ${index + 1}`" class="w-full aspect-square object-cover" />
        <div class="p-2 space-y-2">
          <p class="text-xs font-bold text-[#536124]">{{ index === 0 ? 'Ảnh chính' : `Ảnh ${index + 1}` }}</p>
          <div class="flex items-center justify-between gap-1">
            <button type="button" :disabled="disabled || uploading || index === 0" @click="move(index, -1)" aria-label="Đưa ảnh về trước" class="p-2 rounded-lg hover:bg-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"><ArrowLeft class="w-4 h-4" /></button>
            <button type="button" :disabled="disabled || uploading || index === modelValue.length - 1" @click="move(index, 1)" aria-label="Đưa ảnh về sau" class="p-2 rounded-lg hover:bg-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"><ArrowRight class="w-4 h-4" /></button>
            <button type="button" :disabled="disabled || uploading" @click="remove(index)" aria-label="Xóa ảnh" class="p-2 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-30 cursor-pointer"><Trash2 class="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
    <button type="button" :disabled="disabled || uploading || modelValue.length >= 20" @click="input?.click()"
      @dragover.prevent="dragging = true" @dragleave.prevent="dragging = false" @drop.prevent="drop"
      class="w-full border-2 border-dashed rounded-2xl p-5 text-center text-[#536124] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      :class="dragging ? 'border-[#536124] bg-[#EBF1E6]' : 'border-[#DEE5D4] bg-[#FAF9F5]'">
      <Loader2 v-if="uploading" class="w-6 h-6 mx-auto mb-2 animate-spin" />
      <UploadCloud v-else class="w-6 h-6 mx-auto mb-2" />
      <span class="block text-sm font-bold">{{ uploading ? 'Đang tải ảnh lên...' : 'Chọn nhiều ảnh hoặc kéo thả vào đây' }}</span>
      <span class="block text-xs mt-1">JPG, PNG, WebP, GIF, AVIF · Tối đa 10 MB mỗi ảnh</span>
    </button>
    <input ref="input" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,image/avif" class="hidden" @change="change" />
    <details class="text-xs text-[#7A866E]">
      <summary class="cursor-pointer">Hoặc thêm bằng đường dẫn ảnh</summary>
      <div class="flex gap-2 mt-2">
        <input v-model="imageUrl" :disabled="disabled || uploading" type="url" placeholder="https://..." class="min-w-0 flex-1 border border-[#DEE5D4] rounded-xl px-3 py-2" @keydown.enter.prevent="addUrl" />
        <button type="button" :disabled="disabled || uploading" @click="addUrl" class="px-3 py-2 rounded-xl bg-[#EBF1E6] text-[#536124] cursor-pointer">Thêm ảnh</button>
      </div>
    </details>
    <p v-if="error" role="alert" class="text-xs text-rose-600 whitespace-pre-line">{{ error }}</p>
  </div>
</template>
