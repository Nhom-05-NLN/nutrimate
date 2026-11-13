import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/catalog',
    name: 'catalog',
    component: () => import('../views/CatalogView.vue'),
  },
  {
    path: '/product/:id',
    name: 'product-detail',
    component: () => import('../views/ProductDetailView.vue'),
  },
  {
    path: '/cart',
    name: 'cart',
    component: () => import('../views/CartView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('../views/CheckoutView.vue'),
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('../views/OrdersView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/nutrition',
    name: 'nutrition',
    component: () => import('../views/NutritionDashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { layout: 'blank' },
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('../views/LoginView.vue'),
    meta: { layout: 'blank' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue'),
    meta: { layout: 'blank' },
  },
  {
    path: '/blogs',
    name: 'blogs',
    component: () => import('../views/BlogsView.vue'),
  },
  // Admin Routes
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: () => import('../views/admin/AdminDashboardView.vue'),
    meta: { layout: 'admin' },
  },
  {
    path: '/admin/products',
    name: 'admin-products',
    component: () => import('../views/admin/AdminProductsView.vue'),
    meta: { layout: 'admin' },
  },
  {
    path: '/admin/categories',
    name: 'admin-categories',
    component: () => import('../views/admin/AdminCategoriesView.vue'),
    meta: { layout: 'admin' },
  },
  {
    path: '/admin/orders',
    name: 'admin-orders',
    component: () => import('../views/admin/AdminOrdersView.vue'),
    meta: { layout: 'admin' },
  },
  {
    path: '/admin/customers',
    name: 'admin-customers',
    component: () => import('../views/admin/AdminCustomersView.vue'),
    meta: { layout: 'admin' },
  },
  {
    path: '/admin/vouchers',
    name: 'admin-vouchers',
    component: () => import('../views/admin/AdminVouchersView.vue'),
    meta: { layout: 'admin' },
  },
  {
    path: '/vouchers',
    redirect: '/admin/vouchers',
  },
  {
    path: '/admin/knowledge-base',
    name: 'admin-knowledge-base',
    component: () => import('../views/admin/AdminKnowledgeBaseView.vue'),
    meta: { layout: 'admin' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' };
  },
});

router.beforeEach(async (to) => {
  if (to.path === '/admin/login') {
    return true;
  }

  if (!to.path.startsWith('/admin') && !to.meta.requiresAuth) {
    return true;
  }

  const authStore = useAuthStore();
  try {
    await authStore.restoreSession();
  } catch (error: unknown) {
    console.error('[Router] Không thể xác minh quyền truy cập quản trị:', error);
    return to.path.startsWith('/admin')
      ? { name: 'admin-login' }
      : { name: 'login', query: { redirect: to.fullPath } };
  }

  if (to.path.startsWith('/admin') && authStore.currentUser?.role === 'admin') {
    return true;
  }

  if (to.meta.requiresAuth && authStore.currentUser) return true;

  if (!authStore.currentUser) {
    return to.path.startsWith('/admin')
      ? { name: 'admin-login' }
      : { name: 'login', query: { redirect: to.fullPath } };
  }

  return to.path.startsWith('/admin') ? { name: 'home' } : { name: 'login' };
});
