<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
import ToastNotification from './components/common/ToastNotification.vue';

const DefaultLayout = defineAsyncComponent(() => import('./layouts/DefaultLayout.vue'));
const AdminLayout = defineAsyncComponent(() => import('./layouts/AdminLayout.vue'));
const route = useRoute();
const isBlankLayout = computed(() => route.meta.layout === 'blank');
const isAdminRoute = computed(() => route.path.startsWith('/admin'));
</script>

<template>
  <div v-if="isBlankLayout" class="min-h-screen bg-white">
    <RouterView v-slot="{ Component, route: viewRoute }">
      <Transition name="auth-page" mode="out-in">
        <component :is="Component" :key="viewRoute.path" />
      </Transition>
    </RouterView>
    <ToastNotification />
  </div>
  <component v-else :is="isAdminRoute ? AdminLayout : DefaultLayout">
    <RouterView v-slot="{ Component, route: viewRoute }">
      <Transition name="route-page" mode="out-in">
        <component :is="Component" :key="viewRoute.path" />
      </Transition>
    </RouterView>
  </component>
  <ToastNotification v-if="isAdminRoute && !isBlankLayout" />
</template>
