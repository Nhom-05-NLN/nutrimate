<script setup lang="ts">
import { ref } from 'vue';
import { useToastStore } from '../../stores/toastStore';
import {
  Database,
  Bot,
  RefreshCw,
  Search,
  Upload,
  Play,
  CheckCircle2,
  FileText,
  Eye,
  Trash2,
  Sparkles,
} from 'lucide-vue-next';

const toastStore = useToastStore();

const activeTab = ref('all');
const testQuery = ref('Tôi vừa tập cardio xong, cần nạp 12g protein mà không vượt quá 100 calo?');
const isRunningRAG = ref(false);

function handleRunRAG() {
  isRunningRAG.value = true;
  setTimeout(() => {
    isRunningRAG.value = false;
    toastStore.show('RAG Query hoàn tất!', 'success', 'Truy xuất 3 chunks • Similarity 0.94 • Độ trễ 320ms');
  }, 500);
}

function handleSync() {
  toastStore.show('Đang đồng bộ Vector DB...', 'info', 'ChromaDB & Pinecone đã cập nhật 485.200 embeddings');
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header with System Status (Figma 14) -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="font-heading text-2xl sm:text-3xl font-black text-[#2D3B1E]">
          Cơ Sở Tri Thức Dinh Dưỡng & RAG Vector Engine
        </h1>
        <div class="flex flex-wrap items-center gap-3 text-xs text-[#7A866E] mt-1">
          <span class="flex items-center gap-1.5 text-[#4D6A34] font-semibold">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Vector DB: Hoạt động (ChromaDB / Pinecone)
          </span>
          <span>•</span>
          <span>Model: <strong>Gemini 1.5 Pro / NutriBot v2.4</strong></span>
          <span>•</span>
          <span>Sync gần nhất: 12 phút trước</span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          @click="handleSync"
          class="px-3.5 py-2 rounded-2xl bg-white border border-[#CCD7BC] text-xs font-bold text-[#576449] flex items-center gap-1.5 shadow-2xs hover:bg-[#FAF9F5]"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          <span>Đồng bộ Vector DB</span>
        </button>

        <button
          type="button"
          @click="handleRunRAG"
          class="px-3.5 py-2 rounded-2xl bg-[#3B4E24] hover:bg-[#2D3B1E] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
        >
          <Play class="w-3.5 h-3.5" />
          <span>Kiểm thử RAG Sandbox</span>
        </button>

        <button
          type="button"
          class="px-3.5 py-2 rounded-2xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
        >
          <Upload class="w-3.5 h-3.5" />
          <span>+ Tải lên tài liệu mới</span>
        </button>
      </div>
    </div>

    <!-- 4 KPIs Cards (Figma 14) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Tổng tài nguyên tri thức</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <FileText class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">1.420 <span class="text-xs font-normal text-[#7A866E]">tài liệu</span></div>
        <span class="text-[10px] text-[#7A866E] block">850 bài Y Dược VDD • 420 bảng calo</span>
      </div>

      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Vector Embeddings</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <Database class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">485.200 <span class="text-xs font-normal text-[#7A866E]">vectors</span></div>
        <span class="text-[10px] text-[#7A866E] block">Độ phủ chunk: <strong>99.4%</strong> (Cosine Index)</span>
      </div>

      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Độ chính xác RAG (Accuracy)</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <CheckCircle2 class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#4D6A34]">98.6% <span class="text-xs font-bold text-[#4D6A34]">+1.2%</span></div>
        <span class="text-[10px] text-[#7A866E] block">0% Hallucination nguy hại</span>
      </div>

      <div class="bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-xs text-[#7A866E]">
          <span>Truy xuất gợi ý món (Grounding)</span>
          <div class="w-8 h-8 rounded-xl bg-[#EBF1E6] text-[#4D6A34] flex items-center justify-center">
            <Bot class="w-4 h-4" />
          </div>
        </div>
        <div class="font-heading text-2xl font-black text-[#2D3B1E]">94.2% <span class="text-xs font-normal text-[#7A866E]">khớp SKU</span></div>
        <span class="text-[10px] text-[#7A866E] block">Tự động gắn kho hàng thực tế</span>
      </div>
    </div>

    <!-- 2 Columns Grid: Documents List (Left) & RAG Retrieval Sandbox (Right) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Cột Trái: Danh sách tài liệu tri thức -->
      <div class="lg:col-span-8 bg-white p-6 rounded-3xl border border-[#E3E8DC] shadow-2xs space-y-6">
        <div class="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#F0F3EC]">
          <button
            type="button"
            @click="activeTab = 'all'"
            class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
            :class="activeTab === 'all' ? 'bg-[#4D6A34] text-white' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
          >
            Tất cả tài liệu tri thức (1.420)
          </button>
          <button
            type="button"
            @click="activeTab = 'table'"
            class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
            :class="activeTab === 'table' ? 'bg-[#4D6A34] text-white' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
          >
            Bảng tra cứu Dinh dưỡng (420)
          </button>
          <button
            type="button"
            @click="activeTab = 'protocol'"
            class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
            :class="activeTab === 'protocol' ? 'bg-[#4D6A34] text-white' : 'text-[#7A866E] hover:text-[#2D3B1E]'"
          >
            Phác đồ & Bệnh lý (380)
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#FAF9F5] text-[#7A866E] uppercase text-[10px] font-bold border-b border-[#E3E8DC]">
              <tr>
                <th class="py-3 px-3">Tài liệu tri thức & Metadata</th>
                <th class="py-3 px-3">Phân loại & Tag</th>
                <th class="py-3 px-3">Trạng thái Vector</th>
                <th class="py-3 px-3">Lượt truy xuất</th>
                <th class="py-3 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#F0F3EC]">
              <tr class="hover:bg-[#FAF9F5]">
                <td class="py-3.5 px-3">
                  <h4 class="font-bold text-[#2D3B1E]">Bảng thành phần thực phẩm VN</h4>
                  <span class="text-[10px] text-[#7A866E]">PDF • 18.4 MB • 14.500 chunks đã index</span>
                </td>
                <td class="py-3.5 px-3">
                  <span class="px-2 py-0.5 rounded-md bg-[#EBF1E6] text-[10px] font-bold text-[#4D6A34]">
                    Viện Dinh Dưỡng
                  </span>
                </td>
                <td class="py-3.5 px-3">
                  <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                    ✓ Đã Index 100% (0.96)
                  </span>
                </td>
                <td class="py-3.5 px-3 font-bold text-[#2D3B1E]">12.450 lượt</td>
                <td class="py-3.5 px-3 text-right space-x-1">
                  <button class="p-1.5 text-[#7A866E] hover:text-[#2D3B1E]"><Eye class="w-3.5 h-3.5" /></button>
                  <button class="p-1.5 text-[#7A866E] hover:text-[#4D6A34]"><RefreshCw class="w-3.5 h-3.5" /></button>
                </td>
              </tr>

              <tr class="hover:bg-[#FAF9F5]">
                <td class="py-3.5 px-3">
                  <h4 class="font-bold text-[#2D3B1E]">Quy chuẩn calo & định lượng đạm</h4>
                  <span class="text-[10px] text-[#7A866E]">MD/DOCX • 2.1 MB • 1.280 chunks</span>
                </td>
                <td class="py-3.5 px-3">
                  <span class="px-2 py-0.5 rounded-md bg-[#FAF9F5] text-[10px] font-bold text-amber-800 border border-[#CCD7BC]">
                    Thể thao & Gym
                  </span>
                </td>
                <td class="py-3.5 px-3">
                  <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                    ✓ Đã Index 100% (0.94)
                  </span>
                </td>
                <td class="py-3.5 px-3 font-bold text-[#2D3B1E]">8.120 lượt</td>
                <td class="py-3.5 px-3 text-right space-x-1">
                  <button class="p-1.5 text-[#7A866E] hover:text-[#2D3B1E]"><Eye class="w-3.5 h-3.5" /></button>
                  <button class="p-1.5 text-[#7A866E] hover:text-[#4D6A34]"><RefreshCw class="w-3.5 h-3.5" /></button>
                </td>
              </tr>

              <tr class="hover:bg-[#FAF9F5]">
                <td class="py-3.5 px-3">
                  <h4 class="font-bold text-[#2D3B1E]">Hồ sơ dinh dưỡng 48 SKU NutriMate</h4>
                  <span class="text-[10px] text-[#7A866E]">JSON/DB Sync • 850 chunks đồng bộ</span>
                </td>
                <td class="py-3.5 px-3">
                  <span class="px-2 py-0.5 rounded-md bg-[#EBF1E6] text-[10px] font-bold text-[#4D6A34]">
                    NutriMate Shop SKU
                  </span>
                </td>
                <td class="py-3.5 px-3">
                  <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                    ✓ Đã Index 100% (0.99)
                  </span>
                </td>
                <td class="py-3.5 px-3 font-bold text-[#2D3B1E]">19.380 lượt</td>
                <td class="py-3.5 px-3 text-right space-x-1">
                  <button class="p-1.5 text-[#7A866E] hover:text-[#2D3B1E]"><Eye class="w-3.5 h-3.5" /></button>
                  <button class="p-1.5 text-[#7A866E] hover:text-[#4D6A34]"><RefreshCw class="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Cột Phải: RAG Retrieval Sandbox (Figma 14) -->
      <div class="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#CCD7BC] shadow-sm space-y-5">
        <div class="flex items-center justify-between border-b border-[#F0F3EC] pb-3">
          <div class="flex items-center gap-2">
            <Bot class="w-4 h-4 text-[#4D6A34]" />
            <h3 class="font-heading text-sm font-bold text-[#2D3B1E]">RAG Retrieval Sandbox</h3>
          </div>
          <span class="px-2 py-0.5 rounded-full bg-[#EBF1E6] text-[10px] font-bold text-[#4D6A34]">
            ● Live Mode
          </span>
        </div>
        <p class="text-xs text-[#7A866E]">Mô phỏng truy xuất Vector & Grounding</p>

        <!-- Test Query Input -->
        <div class="space-y-2">
          <label class="text-[11px] font-bold text-[#2D3B1E] block">Câu hỏi thử nghiệm từ người dùng:</label>
          <textarea
            v-model="testQuery"
            rows="3"
            class="w-full p-3 rounded-2xl bg-[#FAF9F5] border border-[#DEE5D4] text-xs text-[#2D3B1E] outline-none focus:bg-white focus:border-[#4D6A34]"
          ></textarea>
        </div>

        <div class="flex items-center justify-between text-xs">
          <span class="text-[10px] text-[#7A866E]">Top-K: 3 Chunks • Threshold: 0.85</span>
          <button
            type="button"
            @click="handleRunRAG"
            :disabled="isRunningRAG"
            class="px-4 py-2 rounded-xl bg-[#4D6A34] hover:bg-[#3B4E24] text-white text-xs font-bold flex items-center gap-1.5"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>Thực thi RAG Query</span>
          </button>
        </div>

        <!-- Trích xuất Top Chunks -->
        <div class="space-y-3 pt-3 border-t border-[#F0F3EC]">
          <span class="text-[10px] font-bold text-[#7A866E] uppercase block">TOP CHUNKS ĐƯỢC TRÍCH XUẤT:</span>

          <!-- Chunk 1 -->
          <div class="p-3 rounded-2xl bg-[#F6F8F3] border border-[#CCD7BC] text-xs space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-bold text-[#2D3B1E]">Chunk #VDD-PRO-0812</span>
              <span class="text-[10px] font-bold text-[#4D6A34]">Similarity: 0.94</span>
            </div>
            <p class="text-[11px] text-[#576449] leading-snug">
              "...Đạm tinh sạch từ ức gà sấy nhiệt thấp cung cấp xấp xỉ 24g protein/100g với mức calo tối ưu dưới 120 calo..."
            </p>
          </div>

          <!-- Chunk 2 -->
          <div class="p-3 rounded-2xl bg-[#F6F8F3] border border-[#CCD7BC] text-xs space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-bold text-[#2D3B1E]">Chunk #SKU-CKN-02</span>
              <span class="text-[10px] font-bold text-[#4D6A34]">Similarity: 0.91</span>
            </div>
            <p class="text-[11px] text-[#576449] leading-snug">
              "...Sản phẩm Ức gà sấy giòn vị thảo mộc NutriMate: Khẩu phần 50g chứa 13.2g Protein, 88 Kcal..."
            </p>
          </div>
        </div>

        <!-- Grounding Match Card -->
        <div class="p-3 rounded-2xl bg-[#FAF9F5] border border-[#CCD7BC] flex items-center justify-between gap-3 text-xs">
          <div class="min-w-0">
            <span class="text-[10px] font-bold text-[#7A866E] block">SẢN PHẨM KHỚP RAG:</span>
            <h4 class="font-bold text-[#2D3B1E] truncate">Ức gà sấy giòn vị thảo mộc</h4>
            <span class="text-[10px] text-[#4D6A34] font-semibold">13.2g Pro • 88 Kcal</span>
          </div>
          <span class="px-2 py-1 rounded-lg bg-[#4D6A34] text-white text-[10px] font-bold shrink-0">
            Khớp 99%
          </span>
        </div>

        <div class="text-[10px] text-[#8C9484] flex justify-between pt-1">
          <span>RAG Latency: <strong>320ms</strong></span>
          <span>Tokens: <strong>142 in / 86 out</strong></span>
        </div>
      </div>
    </div>
  </div>
</template>
