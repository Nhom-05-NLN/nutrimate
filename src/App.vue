<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import DefaultLayout from './layouts/DefaultLayout.vue';
import AdminLayout from './layouts/AdminLayout.vue';

const route = useRoute();
const isAdminRoute = computed(() => route.path.startsWith('/admin'));
</script>

<template>
  <component :is="isAdminRoute ? AdminLayout : DefaultLayout">
    <RouterView />
  </component>
</template>
