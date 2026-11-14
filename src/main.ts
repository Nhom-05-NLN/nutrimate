import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { router } from './router';
import { useAuthStore } from './stores/authStore';
import App from './App.vue';
import './style.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

const authStore = useAuthStore(pinia);
authStore.setSessionExpiredHandler(() => {
  const route = router.currentRoute.value;
  const loginRoute = route.path.startsWith('/admin')
    ? { name: 'admin-login' }
    : route.meta.requiresAuth
      ? { name: 'login', query: { redirect: route.fullPath } }
      : null;

  if (loginRoute) {
    void router.replace(loginRoute).catch((error: unknown) => {
      console.error('[Router] Không thể chuyển đến trang đăng nhập sau khi phiên hết hạn:', error);
    });
  }
});
void authStore.restoreSession().catch((error: unknown) => {
  console.error('[AuthStore] Không thể khôi phục phiên đăng nhập:', error);
});

app.mount('#app');
