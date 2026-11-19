
<script setup lang="ts">
import {
  Mail,
  MapPin,
  Phone,
  Truck,
} from 'lucide-vue-next';
</script>

<template>
  <footer class="border-t border-[#B6BF91] bg-[#D9DEB8] text-[#242A1D]">
    <div class="mx-auto max-w-[1316px] px-5 py-8 sm:px-8">
      <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.45fr_1.05fr_0.85fr_0.95fr] lg:gap-12">
        <div>
          <RouterLink
            to="/"
            class="inline-flex rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B4E24]"
          >
            <img
              src="../../public/logo_nutrimate_transparent.png"
              alt="NutriMate"
              class="h-10 w-auto max-w-[190px] object-contain sm:h-12 sm:max-w-[220px]"
            />
          </RouterLink>
          <h2 class="mt-4 font-heading text-lg font-black leading-snug text-[#242424] sm:text-xl">
            Ăn lành mạnh hơn,<br class="hidden sm:block" /> sống trọn mỗi ngày.
          </h2>
          <p class="mt-2 max-w-sm text-xs leading-5 text-[#5F6D4D]">
            Thực phẩm lành mạnh và kiến thức dinh dưỡng cho lựa chọn phù hợp mỗi ngày.
          </p>
        </div>

        <div>
          <h3 class="text-xs font-bold uppercase tracking-[0.14em] text-[#35432A]">Liên hệ</h3>
          <ul class="mt-3 space-y-2 text-xs text-[#5F6D4D]">
            <li class="flex items-start gap-3">
              <Phone class="mt-0.5 h-4 w-4 shrink-0 text-[#6B7A3A]" />
              <a href="tel:19006767" class="footer-link transition hover:text-[#2D3B1E]">Hotline: 1900 6767</a>
            </li>
            <li class="flex items-start gap-3">
              <Mail class="mt-0.5 h-4 w-4 shrink-0 text-[#6B7A3A]" />
              <a href="mailto:contact@nutrimate.vn" class="footer-link transition hover:text-[#2D3B1E]">contact@nutrimate.vn</a>
            </li>
            <li class="flex items-start gap-3">
              <MapPin class="mt-0.5 h-4 w-4 shrink-0 text-[#6B7A3A]" />
              <span>Đại học Cần Thơ, 3/2, Ninh Kiều, Cần Thơ.</span>
            </li>
          </ul>
        </div>

        <nav aria-label="Liên kết về NutriMate">
          <h3 class="text-xs font-bold uppercase tracking-[0.14em] text-[#35432A]">Khám phá</h3>
          <ul class="mt-3 space-y-2 text-xs text-[#5F6D4D]">
            <li><RouterLink to="/" class="footer-link transition hover:text-[#2D3B1E]">Trang chủ</RouterLink></li>
            <li><RouterLink to="/catalog" class="footer-link transition hover:text-[#2D3B1E]">Sản phẩm</RouterLink></li>
            <li><RouterLink to="/blogs" class="footer-link transition hover:text-[#2D3B1E]">Kiến thức dinh dưỡng</RouterLink></li>
            <li><RouterLink to="/partners" class="footer-link transition hover:text-[#2D3B1E]">Hệ thống đối tác</RouterLink></li>
          </ul>
        </nav>

        <nav aria-label="Hỗ trợ khách hàng">
          <h3 class="text-xs font-bold uppercase tracking-[0.14em] text-[#35432A]">Hỗ trợ</h3>
          <ul class="mt-3 space-y-2 text-xs text-[#5F6D4D]">
            <li><RouterLink to="/returns" class="footer-link transition hover:text-[#2D3B1E]">Chính sách đổi trả</RouterLink></li>
            <li><RouterLink to="/privacy" class="footer-link transition hover:text-[#2D3B1E]">Chính sách bảo mật</RouterLink></li>
            <li><RouterLink to="/nutribot-guide" class="footer-link transition hover:text-[#2D3B1E]">Hướng dẫn NutriBot</RouterLink></li>
            <li><RouterLink to="/help" class="footer-link transition hover:text-[#2D3B1E]">Trung tâm trợ giúp</RouterLink></li>
          </ul>
        </nav>
      </div>
    </div>
    <div class="mx-auto max-w-[1316px] px-5 pb-6 sm:px-8">
      <div class="border-t border-[#9FAA76]/70 pt-5">
        <div class="grid grid-cols-1 items-center gap-4 text-center md:grid-cols-[0.8fr_0.9fr_1.3fr] md:text-left">
          <p class="text-[11px] leading-5 text-[#4F5D3C] md:justify-self-start">
            © 2026 NutriMate. All rights reserved.
          </p>

          <div class="flex items-center justify-center gap-2" aria-label="Mạng xã hội">
            <span class="mr-1 text-[11px] font-semibold text-[#4F5D3C]">Theo dõi</span>
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              class="social-link"
            >
              <span class="social-icon social-icon-facebook" aria-hidden="true"></span>
            </a>
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              class="social-link"
            >
              <span class="social-icon social-icon-instagram" aria-hidden="true"></span>
            </a>
            <a
              href="https://www.tiktok.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              class="social-link"
            >
              <span class="social-icon social-icon-tiktok" aria-hidden="true"></span>
            </a>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-2 md:justify-self-end" aria-label="Phương thức thanh toán">
            <span class="mr-1 text-[11px] font-semibold text-[#4F5D3C]">Thanh toán</span>
            <span class="payment-badge payment-napas" title="Chuyển khoản VietQR Napas 24/7">
              <img src="/payment/napas.png" alt="Napas" class="h-5 w-auto" />
              <span>24/7</span>
            </span>
            <span class="payment-badge" title="Thanh toán tiền mặt khi nhận hàng">
              <Truck class="h-4 w-4 text-[#5F6D4D]" />
              <span>COD</span>
            </span>
            <span class="payment-badge payment-wallet" title="Ví điện tử MoMo / ZaloPay">
              <span class="payment-momo">MoMo</span>
              <span class="payment-divider">/</span>
              <span class="payment-zalopay">ZaloPay</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer-link {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  position: relative;
}

.footer-link::after {
  position: absolute;
  right: 0;
  bottom: -3px;
  left: 0;
  height: 1px;
  background: #536124;
  content: '';
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 180ms ease;
}

.footer-link:hover {
  transform: translateX(3px);
}

.footer-link:hover::after,
.footer-link:focus-visible::after {
  transform: scaleX(1);
}

.footer-link:focus-visible {
  border-radius: 2px;
  outline: 2px solid #6b7a3a;
  outline-offset: 4px;
}

.footer-link,
.footer-link::after,
.social-link {
  backface-visibility: hidden;
}

.social-link {
  display: inline-flex;
  height: 28px;
  min-width: 28px;
  align-items: center;
  justify-content: center;
  border: 1px solid #8E9A68;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.35);
  padding: 0 7px;
  color: #35432A;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
  transition: background-color 180ms ease, color 180ms ease, transform 180ms ease;
}

.social-link:hover {
  background: #3F4F2A;
  color: #FFFFFF;
  transform: translateY(-2px);
}

.social-link:focus-visible {
  outline: 2px solid #3F4F2A;
  outline-offset: 3px;
}

.social-icon {
  display: block;
  width: 16px;
  height: 16px;
  background: #536124;
  mask-position: center;
  mask-repeat: no-repeat;
  mask-size: contain;
  transition: background-color 180ms ease;
}

.social-icon-facebook {
  mask-image: url('/social/facebook.svg');
}

.social-icon-instagram {
  mask-image: url('/social/instagram.svg');
}

.social-icon-tiktok {
  mask-image: url('/social/tiktok.svg');
}

.social-link:hover .social-icon {
  background: #FFFFFF;
}

.payment-badge {
  display: inline-flex;
  height: 28px;
  align-items: center;
  gap: 5px;
  border: 1px solid #A2AA82;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.55);
  padding: 0 8px;
  color: #465338;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
}

.payment-napas {
  gap: 4px;
  border-color: #A2AA82;
  color: #536124;
  font-size: 9px;
}

.payment-napas img {
  filter: grayscale(1) sepia(1) saturate(1.4) hue-rotate(32deg) brightness(0.72);
}

.payment-wallet {
  padding: 0 7px;
}

.payment-momo {
  color: #536124;
}

.payment-zalopay {
  color: #536124;
}

@media (prefers-reduced-motion: reduce) {
  .footer-link,
  .footer-link::after,
  .social-link {
    transition: none;
  }
}
</style>
