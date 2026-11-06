import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import CatalogView from '../views/CatalogView.vue';
import ProductDetailView from '../views/ProductDetailView.vue';
import CartView from '../views/CartView.vue';
import CheckoutView from '../views/CheckoutView.vue';
import OrdersView from '../views/OrdersView.vue';
import ProfileView from '../views/ProfileView.vue';
import NutritionDashboardView from '../views/NutritionDashboardView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import BlogsView from '../views/BlogsView.vue';
import NotFoundView from '../views/NotFoundView.vue';
import { useAuthStore } from '../stores/authStore';

// Admin Views
import AdminDashboardView from '../views/admin/AdminDashboardView.vue';
import AdminProductsView from '../views/admin/AdminProductsView.vue';
import AdminCategoriesView from '../views/admin/AdminCategoriesView.vue';
import AdminInventoryView from '../views/admin/AdminInventoryView.vue';
import AdminOrdersView from '../views/admin/AdminOrdersView.vue';
import AdminCustomersView from '../views/admin/AdminCustomersView.vue';
import AdminKnowledgeBaseView from '../views/admin/AdminKnowledgeBaseView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/catalog',
    name: 'catalog',
    component: CatalogView,
  },
  {
    path: '/product/:id',
    name: 'product-detail',
    component: ProductDetailView,
  },
  {
    path: '/cart',
    name: 'cart',
    component: CartView,
    meta: { requiresAuth: true },
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: CheckoutView,
  },
  {
    path: '/orders',
    name: 'orders',
    component: OrdersView,
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { requiresAuth: true },
  },
  {
    path: '/nutrition',
    name: 'nutrition',
    component: NutritionDashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { layout: 'blank' },
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: LoginView,
    meta: { layout: 'blank' },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { layout: 'blank' },
  },
  {
    path: '/blogs',
    name: 'blogs',
    component: BlogsView,
  },
  // Admin Routes
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: AdminDashboardView,
    meta: { layout: 'admin' },
  },
  {
    path: '/admin/products',
    name: 'admin-products',
    component: AdminProductsView,
    meta: { layout: 'admin' },
  },
  {
    path: '/admin/categories',
    name: 'admin-categories',
    component: AdminCategoriesView,
    meta: { layout: 'admin' },
  },
  {
    path: '/admin/inventory',
    name: 'admin-inventory',
    component: AdminInventoryView,
    meta: { layout: 'admin' },
  },
  {
    path: '/admin/orders',
    name: 'admin-orders',
    component: AdminOrdersView,
    meta: { layout: 'admin' },
  },
  {
    path: '/admin/customers',
    name: 'admin-customers',
    component: AdminCustomersView,
    meta: { layout: 'admin' },
  },
  {
    path: '/admin/knowledge-base',
    name: 'admin-knowledge-base',
    component: AdminKnowledgeBaseView,
    meta: { layout: 'admin' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
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
