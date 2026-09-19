<script setup lang="ts">
import Navbar from '../components/layout/Navbar.vue';
import Footer from '../components/layout/Footer.vue';
import CartDrawer from '../components/cart/CartDrawer.vue';
import CheckoutModal from '../components/checkout/CheckoutModal.vue';
import ProductDetailModal from '../components/catalog/ProductDetailModal.vue';
import NutriBotWidget from '../components/chatbot/NutriBotWidget.vue';
import ToastNotification from '../components/common/ToastNotification.vue';
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#fcfdfa] text-slate-900 selection:bg-emerald-200 selection:text-emerald-950">
    <!-- Navbar Header -->
    <Navbar />

    <!-- Main Content Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
      <slot />
    </main>

    <!-- Footer -->
    <Footer />

    <!-- Overlays, Drawers & Modals -->
    <CartDrawer />
    <CheckoutModal />
    <ProductDetailModal />
    <NutriBotWidget />
    <ToastNotification />
  </div>
</template>
