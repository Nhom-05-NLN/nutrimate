<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import DefaultLayout from './layouts/DefaultLayout.vue';
import AdminLayout from './layouts/AdminLayout.vue';
import ToastNotification from './components/common/ToastNotification.vue';

const route = useRoute();
const isBlankLayout = computed(() => route.meta.layout === 'blank');
const isAdminRoute = computed(() => route.path.startsWith('/admin'));
</script>

<template>
  <div v-if="isBlankLayout" class="min-h-screen bg-white">
    <RouterView />
    <ToastNotification />
  </div>
  <component v-else :is="isAdminRoute ? AdminLayout : DefaultLayout">
    <RouterView />
  </component>
</template>
