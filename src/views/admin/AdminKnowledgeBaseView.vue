<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Bot, CheckCircle2, FilePlus2, FileText, Pencil, Save, Trash2, X } from 'lucide-vue-next';
import {
  createKnowledgeEntry,
  deleteKnowledgeEntry,
  fetchKnowledgeEntries,
  importKnowledgeEntries,
  updateKnowledgeEntry,
} from '../../services/api';
import type { KnowledgeBaseEntry, KnowledgeBaseEntryPayload } from '../../types';
import { useToastStore } from '../../stores/toastStore';

interface KnowledgeForm {
  question: string;
  answer: string;
  category: string;
}

const MAX_IMPORT_FILE_SIZE = 1024 * 1024;
const MAX_IMPORT_ENTRIES = 500;
const toastStore = useToastStore();
const records = ref<KnowledgeBaseEntry[]>([]);
const importFileInput = ref<HTMLInputElement | null>(null);
const isLoading = ref(false);
const isSaving = ref(false);
const isImporting = ref(false);
const importFeedback = ref<{ message: string; type: 'success' | 'error' } | null>(null);
const isEditing = ref(false);
const editId = ref<number | null>(null);

const emptyForm: KnowledgeForm = {
  question: '',
  answer: '',
  category: '',
};

const form = ref<KnowledgeForm>({ ...emptyForm });

function resetForm() {
  form.value = { ...emptyForm };
  isEditing.value = false;
  editId.value = null;
}

function formatDate(value: string | null): string {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Không hợp lệ' : date.toLocaleString('vi-VN');
}

async function loadKnowledge() {
  isLoading.value = true;
  try {
    records.value = await fetchKnowledgeEntries();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Không tải được tri thức.';
    toastStore.show(message, 'error');
  } finally {
    isLoading.value = false;
  }
}

async function handleSubmit() {
  const question = form.value.question.trim();
  const answer = form.value.answer.trim();
  const category = form.value.category.trim();

  if (!question) {
    toastStore.show('Câu hỏi không được để trống.', 'error');
    return;
  }
  if (!answer) {
    toastStore.show('Câu trả lời không được để trống.', 'error');
    return;
  }
  if (category.length > 100) {
    toastStore.show('Danh mục không được vượt quá 100 ký tự.', 'error');
    return;
  }
  isSaving.value = true;
  try {
    const payload = {
      question,
      answer,
      category: category || undefined,
    };

    if (isEditing.value && editId.value !== null) {
      await updateKnowledgeEntry(editId.value, payload);
      toastStore.show('Cập nhật tri thức thành công.', 'success');
    } else {
      await createKnowledgeEntry(payload);
      toastStore.show('Thêm tri thức mới thành công.', 'success');
    }

    await loadKnowledge();
    resetForm();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Không thể lưu tri thức.';
    toastStore.show(message, 'error');
  } finally {
    isSaving.value = false;
  }
}

function parseKnowledgeFile(content: string): KnowledgeBaseEntryPayload[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content.replace(/^\uFEFF/, '').trim());
  } catch {
    throw new Error('File không phải JSON hợp lệ.');
  }

  const rawEntries = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'object' && parsed !== null
      ? ['entries', 'questions', 'data', 'rows'].map((key) => (key in parsed ? parsed[key] : null)).find(Array.isArray) ?? null
      : null;

  if (!rawEntries || rawEntries.length === 0 || rawEntries.length > MAX_IMPORT_ENTRIES) {
    throw new Error(`JSON phải là một mảng tri thức hoặc object có entries/questions/data/rows (1–${MAX_IMPORT_ENTRIES} mục).`);
  }

  return rawEntries.map((entry: unknown, index: number) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      throw new Error(`Mục ${index + 1} phải là object.`);
    }
    const record = entry as Record<string, unknown>;
    if (typeof record.question !== 'string' || !record.question.trim()) {
      throw new Error(`Mục ${index + 1}: question phải là chuỗi không rỗng.`);
    }
    if (typeof record.answer !== 'string' || !record.answer.trim()) {
      throw new Error(`Mục ${index + 1}: answer phải là chuỗi không rỗng.`);
    }
    if (record.category !== undefined && record.category !== null && typeof record.category !== 'string') {
      throw new Error(`Mục ${index + 1}: category phải là chuỗi.`);
    }
    return {
      question: record.question,
      answer: record.answer,
      ...(typeof record.category === 'string' ? { category: record.category } : {}),
    };
  });
}

async function handleImportFile(event: Event) {
  const input = event.currentTarget;
  if (!(input instanceof HTMLInputElement)) return;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  importFeedback.value = null;
  if (!file.name.toLowerCase().endsWith('.json')) {
    const message = 'Vui lòng chọn file có định dạng .json.';
    importFeedback.value = { message, type: 'error' };
    toastStore.show(message, 'error');
    return;
  }
  if (file.size > MAX_IMPORT_FILE_SIZE) {
    const message = 'Kích thước file tối đa là 1 MB.';
    importFeedback.value = { message, type: 'error' };
    toastStore.show(message, 'error');
    return;
  }

  isImporting.value = true;
  try {
    const entries = parseKnowledgeFile(await file.text());
    const result = await importKnowledgeEntries(entries);
    const message = result.imported > 0
      ? `Đã nhập ${result.imported}/${result.total} tri thức${result.skipped ? `, bỏ qua ${result.skipped} mục đã có` : ''}.`
      : 'Các tri thức trong file đã có trong danh sách.';
    importFeedback.value = { message, type: 'success' };
    try {
      records.value = await fetchKnowledgeEntries();
      toastStore.show(message, 'success');
    } catch {
      toastStore.show(`${message} Hãy tải lại danh sách để xem dữ liệu mới.`, 'success');
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Không thể nhập file tri thức.';
    importFeedback.value = { message, type: 'error' };
    toastStore.show(message, 'error');
  } finally {
    isImporting.value = false;
  }
}

function startEdit(item: KnowledgeBaseEntry) {
  isEditing.value = true;
  editId.value = item.id;
  form.value = {
    question: item.question ?? '',
    answer: item.answer ?? '',
    category: item.category ?? '',
  };
}

async function handleDelete(id: number) {
  const confirmed = window.confirm('Bạn có chắc muốn xóa tri thức này?');
  if (!confirmed) return;

  try {
    await deleteKnowledgeEntry(id);
    toastStore.show('Đã xóa tri thức.', 'success');
    await loadKnowledge();
    if (editId.value === id) resetForm();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Không thể xóa tri thức.';
    toastStore.show(message, 'error');
  }
}

onMounted(() => {
  void loadKnowledge();
});
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-4 rounded-3xl border border-[#E3E8DC] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6B7B5E]">Admin panel</p>
        <h1 class="mt-2 text-2xl font-black text-[#2D3B1E] sm:text-3xl">Quản lý dữ liệu tri thức NutriBot</h1>
      </div>
      <div>
        <input
          ref="importFileInput"
          type="file"
          accept=".json,application/json"
          class="sr-only"
          tabindex="-1"
          @change="handleImportFile"
        />
        <button
          type="button"
          :disabled="isImporting"
          @click="importFileInput?.click()"
          class="inline-flex items-center gap-2 rounded-2xl border border-[#D7E0CE] bg-white px-4 py-2.5 text-sm font-bold text-[#2D3B1E] transition hover:border-[#C2CFB5] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FilePlus2 class="h-4 w-4" />
          {{ isImporting ? 'Đang nhập file...' : 'Nhập tri thức JSON' }}
        </button>
        <p class="mt-2 max-w-xs text-xs leading-5 text-[#6B7B5E]">
          Chọn file JSON tối đa 1 MB. Mỗi mục gồm question, answer và category (tùy chọn).
        </p>
        <p
          v-if="importFeedback"
          role="status"
          aria-live="polite"
          class="mt-2 max-w-xs text-xs leading-5"
          :class="importFeedback.type === 'success' ? 'text-emerald-700' : 'text-rose-700'"
        >
          {{ importFeedback.message }}
        </p>
      </div>
    </header>

    <div class="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
      <section class="rounded-3xl border border-[#E3E8DC] bg-white p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-[#2D3B1E]">
            <FileText class="h-4 w-4 text-[#4D6A34]" />
            <h2 class="text-lg font-bold">Danh sách tri thức</h2>
          </div>
          <span class="rounded-full bg-[#EEF5E7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#4D6A34]">
            {{ records.length }} mục
          </span>
        </div>

        <div v-if="isLoading" class="rounded-2xl border border-dashed border-[#CDD8C7] bg-[#F8FBF5] p-8 text-center text-sm text-[#6B7B5E]">
          Đang tải dữ liệu tri thức...
        </div>

        <div v-else-if="records.length === 0" class="rounded-2xl border border-dashed border-[#CDD8C7] bg-[#F8FBF5] p-8 text-center text-sm text-[#6B7B5E]">
          Chưa có mẫu tri thức nào. Thêm mục mới để NutriBot phản hồi chính xác hơn.
        </div>

        <div v-else class="space-y-3">
          <article v-for="item in records" :key="item.id" class="rounded-2xl border border-[#E8ECDF] bg-[#FAFBF8] p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <Bot class="h-4 w-4 text-[#4D6A34]" />
                  <p class="text-base font-black text-[#2D3B1E]">{{ item.question || 'Chưa nhập câu hỏi' }}</p>
                </div>
                <p class="mt-2 text-xs text-[#6B7B5E]">ID: {{ item.id }}</p>
              </div>

              <div class="flex gap-2">
                <button
                  type="button"
                  @click="startEdit(item)"
                  class="inline-flex items-center gap-1 rounded-xl border border-[#D7E0CE] bg-white px-2.5 py-1.5 text-xs font-bold text-[#2D3B1E] hover:border-[#C2CFB5]"
                >
                  <Pencil class="h-3.5 w-3.5" />
                  Sửa
                </button>
                <button
                  type="button"
                  @click="handleDelete(item.id)"
                  class="inline-flex items-center gap-1 rounded-xl border border-[#E8CECD] bg-[#FFF7F7] px-2.5 py-1.5 text-xs font-bold text-[#B0514C] hover:border-[#D9B1AF]"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                  Xóa
                </button>
              </div>
            </div>

            <p class="mt-3 text-sm leading-6 text-[#465240]">{{ item.answer || 'Chưa nhập câu trả lời' }}</p>

            <div class="mt-3 flex items-center gap-2">
              <CheckCircle2 class="h-4 w-4 text-[#4D6A34]" />
              <span class="text-[11px] font-bold uppercase tracking-[0.12em] text-[#4D6A34]">
                {{ item.category || 'Chưa phân loại' }}
              </span>
            </div>
            <p class="mt-2 text-[11px] text-[#7A8473]">
              Tạo: {{ formatDate(item.createdAt) }} · Cập nhật: {{ formatDate(item.updatedAt) }}
            </p>
          </article>
        </div>
      </section>

      <aside class="rounded-3xl border border-[#E3E8DC] bg-white p-5 shadow-sm">
        <div class="mb-4 flex items-center gap-2">
          <Bot class="h-4 w-4 text-[#4D6A34]" />
          <h2 class="text-lg font-bold text-[#2D3B1E]">
            {{ isEditing ? 'Cập nhật tri thức' : 'Thêm tri thức mới' }}
          </h2>
        </div>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-[#2D3B1E]">Câu hỏi</label>
            <input
              v-model="form.question"
              type="text"
              placeholder="Ví dụ: Thực phẩm nào giàu protein?"
              class="w-full rounded-2xl border border-[#D9E1D1] bg-[#FAFBF8] px-3 py-2.5 text-sm text-[#2D3B1E] outline-none ring-0 transition focus:border-[#4D6A34]"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-[#2D3B1E]">Danh mục</label>
            <input
              v-model="form.category"
              type="text"
              maxlength="100"
              placeholder="Ví dụ: dinh dưỡng, sản phẩm"
              class="w-full rounded-2xl border border-[#D9E1D1] bg-[#FAFBF8] px-3 py-2.5 text-sm text-[#2D3B1E] outline-none transition focus:border-[#4D6A34]"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-[#2D3B1E]">Câu trả lời</label>
            <textarea
              v-model="form.answer"
              rows="7"
              placeholder="Nhập nội dung trả lời sử dụng cho NutriBot..."
              class="w-full rounded-2xl border border-[#D9E1D1] bg-[#FAFBF8] px-3 py-2.5 text-sm text-[#2D3B1E] outline-none transition focus:border-[#4D6A34]"
            />
          </div>

          <div class="flex gap-3 pt-2">
            <button
              v-if="isEditing"
              type="button"
              @click="resetForm"
              class="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#D9E1D1] bg-white px-3 py-2.5 text-sm font-bold text-[#465240]"
            >
              <X class="h-4 w-4" />
              Hủy
            </button>

            <button
              type="submit"
              :disabled="isSaving"
              class="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#4D6A34] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[#3B4E24] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save class="h-4 w-4" />
              {{ isSaving ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Lưu tri thức' }}
            </button>
          </div>
        </form>
      </aside>
    </div>
  </div>
</template>
