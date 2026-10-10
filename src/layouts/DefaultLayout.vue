<script setup lang="ts">
import Navbar from '../components/layout/Navbar.vue';
import Footer from '../components/layout/Footer.vue';
import CartDrawer from '../components/cart/CartDrawer.vue';
import CheckoutModal from '../components/checkout/CheckoutModal.vue';
import ProductDetailModal from '../components/catalog/ProductDetailModal.vue';
import NutriBotWidget from '../components/chatbot/NutriBotWidget.vue';
import ToastNotification from '../components/common/ToastNotification.vue';
import AuthModal from '../components/auth/AuthModal.vue';
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F7F3E8] text-[#242424] selection:bg-[#EBF7E5] selection:text-[#3B4E24]">
    <!-- Navbar Header (Full Width) -->
    <Navbar />

    <!-- Main Content (Full Width allowing Sections to stretch 100%) -->
    <main class="flex-1 w-full">
      <slot />
    </main>

    <!-- Footer (Full Width) -->
    <Footer />

    <!-- Overlays, Drawers & Modals -->
    <CartDrawer />
    <CheckoutModal />
    <ProductDetailModal />
    <NutriBotWidget />
    <ToastNotification />
    <AuthModal />
  </div>
</template>
