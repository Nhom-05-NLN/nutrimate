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
void authStore.restoreSession().catch((error: unknown) => {
  console.error('[AuthStore] Không thể khôi phục phiên đăng nhập:', error);
});

app.mount('#app');
