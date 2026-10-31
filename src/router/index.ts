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

// Admin Views
import AdminDashboardView from '../views/admin/AdminDashboardView.vue';
import AdminProductsView from '../views/admin/AdminProductsView.vue';
import AdminOrdersView from '../views/admin/AdminOrdersView.vue';
import AdminCustomersView from '../views/admin/AdminCustomersView.vue';
import AdminVouchersView from '../views/admin/AdminVouchersView.vue';
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
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
  },
  {
    path: '/nutrition',
    name: 'nutrition',
    component: NutritionDashboardView,
  },
  {
    path: '/login',
    name: 'login',
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
    path: '/admin/vouchers',
    name: 'admin-vouchers',
    component: AdminVouchersView,
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
