<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next';
</script>

<template>
  <div class="py-24 text-center space-y-4 max-w-md mx-auto">
    <div class="font-heading text-7xl font-extrabold text-emerald-600">404</div>
    <h1 class="font-heading text-2xl font-bold text-slate-900">Không tìm thấy trang yêu cầu</h1>
    <p class="text-sm text-slate-500 leading-relaxed">
      Đường dẫn bạn vừa truy cập có thể đã được thay đổi hoặc không tồn tại trên NutriMate.
    </p>
    <div class="pt-4">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md"
      >
        <ArrowLeft class="w-4 h-4" />
        <span>Về Trang Chủ</span>
      </RouterLink>
    </div>
  </div>
</template>
