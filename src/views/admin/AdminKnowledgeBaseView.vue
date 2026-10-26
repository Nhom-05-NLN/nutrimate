<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Bot, CheckCircle2, FileText, Pencil, Plus, Save, Trash2, X } from 'lucide-vue-next';
import {
  createKnowledgeEntry,
  deleteKnowledgeEntry,
  fetchKnowledgeEntries,
  type KnowledgeEntry,
  updateKnowledgeEntry,
} from '../../services/api';
import { useToastStore } from '../../stores/toastStore';

interface KnowledgeForm {
  intentTag: string;
  keywordPatterns: string;
  answerTemplate: string;
  recommendedCategory: string;
}

const toastStore = useToastStore();
const records = ref<KnowledgeEntry[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);
const isEditing = ref(false);
const editId = ref<number | null>(null);

const emptyForm: KnowledgeForm = {
  intentTag: '',
  keywordPatterns: '',
  answerTemplate: '',
  recommendedCategory: 'all',
};

const form = ref<KnowledgeForm>({ ...emptyForm });

function resetForm() {
  form.value = { ...emptyForm };
  isEditing.value = false;
  editId.value = null;
}

function parseKeywords(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getCategoryLabel(value?: string): string {
  if (!value) return 'Không gắn mục tiêu';
  const labels: Record<string, string> = {
    all: 'Tất cả',
    'low-carb': 'Low-Carb',
    'high-protein': 'High-Protein',
    'sugar-free': 'Sugar-Free',
  };
  return labels[value] ?? value;
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
  const intentTag = form.value.intentTag.trim();
  const keywordPatterns = parseKeywords(form.value.keywordPatterns);
  const answerTemplate = form.value.answerTemplate.trim();

  if (!intentTag || intentTag.length > 50) {
    toastStore.show('Mã intent phải có từ 1 đến 50 ký tự.', 'error');
    return;
  }
  if (keywordPatterns.length === 0 || keywordPatterns.length > 30) {
    toastStore.show('Cần ít nhất 1 và tối đa 30 từ khóa.', 'error');
    return;
  }
  if (!answerTemplate || answerTemplate.length > 4000) {
    toastStore.show('Nội dung câu trả lời phải có từ 1 đến 4000 ký tự.', 'error');
    return;
  }

  isSaving.value = true;
  try {
    const payload = {
      intentTag,
      keywordPatterns,
      answerTemplate,
      recommendedCategory: form.value.recommendedCategory === 'all' ? undefined : form.value.recommendedCategory,
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

function startEdit(item: KnowledgeEntry) {
  isEditing.value = true;
  editId.value = item.id;
  form.value = {
    intentTag: item.intentTag,
    keywordPatterns: item.keywordPatterns.join(', '),
    answerTemplate: item.answerTemplate,
    recommendedCategory: item.recommendedCategory ?? 'all',
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
      <button
        type="button"
        @click="resetForm"
        class="inline-flex items-center gap-2 rounded-2xl bg-[#4D6A34] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#3B4E24]"
      >
        <Plus class="h-4 w-4" />
        Thêm mẫu tri thức
      </button>
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
                  <p class="text-base font-black text-[#2D3B1E]">{{ item.intentTag }}</p>
                </div>
                <p class="mt-2 text-xs text-[#6B7B5E]">
                  Từ khóa: {{ item.keywordPatterns.join(', ') }}
                </p>
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

            <p class="mt-3 text-sm leading-6 text-[#465240]">{{ item.answerTemplate }}</p>

            <div class="mt-3 flex items-center gap-2">
              <CheckCircle2 class="h-4 w-4 text-[#4D6A34]" />
              <span class="text-[11px] font-bold uppercase tracking-[0.12em] text-[#4D6A34]">
                {{ getCategoryLabel(item.recommendedCategory) }}
              </span>
            </div>
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
            <label class="text-sm font-semibold text-[#2D3B1E]">Intent tag</label>
            <input
              v-model="form.intentTag"
              type="text"
              maxlength="50"
              placeholder="ví dụ: high_protein_gym"
              class="w-full rounded-2xl border border-[#D9E1D1] bg-[#FAFBF8] px-3 py-2.5 text-sm text-[#2D3B1E] outline-none ring-0 transition focus:border-[#4D6A34]"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-[#2D3B1E]">Từ khóa</label>
            <textarea
              v-model="form.keywordPatterns"
              rows="4"
              placeholder="protein, tăng cơ, gym, đạm"
              class="w-full rounded-2xl border border-[#D9E1D1] bg-[#FAFBF8] px-3 py-2.5 text-sm text-[#2D3B1E] outline-none transition focus:border-[#4D6A34]"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-[#2D3B1E]">Phân loại gợi ý</label>
            <select
              v-model="form.recommendedCategory"
              class="w-full rounded-2xl border border-[#D9E1D1] bg-[#FAFBF8] px-3 py-2.5 text-sm text-[#2D3B1E] outline-none transition focus:border-[#4D6A34]"
            >
              <option value="all">Tất cả</option>
              <option value="low-carb">Low-Carb</option>
              <option value="high-protein">High-Protein</option>
              <option value="sugar-free">Sugar-Free</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-[#2D3B1E]">Câu trả lời mẫu</label>
            <textarea
              v-model="form.answerTemplate"
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
