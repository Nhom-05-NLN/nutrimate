<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Star } from 'lucide-vue-next';
import { fetchProducts, fetchProductReviews } from '../../services/api';
import type { Product } from '../../types';
import type { ProductReview } from '../../services/api';

interface CustomerReview extends ProductReview {
  productName: string;
}

const reviews = ref<CustomerReview[]>([]);
const failedAvatarIds = ref(new Set<string>());
const isLoading = ref(true);
const loadError = ref('');

function markAvatarFailed(reviewId: string) {
  failedAvatarIds.value = new Set(failedAvatarIds.value).add(reviewId);
}

onMounted(async () => {
  try {
    const result = await fetchProducts({ sort: 'rating_desc', limit: 5 });
    const productReviews = await Promise.all(
      result.products.map(async (product: Product) => ({
        product,
        reviews: await fetchProductReviews(product.id),
      })),
    );
    reviews.value = productReviews
      .flatMap(({ product, reviews: productReviewList }) =>
        productReviewList
          .filter((review) => review.content.trim() && review.rating >= 4 && review.rating <= 5)
          .map((review) => ({ ...review, productName: product.name })),
      )
      .slice(0, 3);
  } catch (error: unknown) {
    loadError.value = error instanceof Error ? error.message : 'Không thể tải đánh giá khách hàng.';
    console.error('[TestimonialsSection] Không thể tải đánh giá:', error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <section class="w-full bg-[#F7F3E8] py-12 text-center sm:py-14">
    <div class="max-w-[1316px] mx-auto px-4 sm:px-8">
      <div class="mx-auto mb-8 max-w-2xl space-y-2 sm:mb-10">
        <span class="text-xs font-bold text-[#6B7A3A] uppercase tracking-wider block">
          CỘNG ĐỒNG NUTRIMATE
        </span>
        <h2 class="font-heading text-2xl sm:text-3xl font-black text-[#242424]">
          Trải nghiệm thực tế từ người dùng
        </h2>
        <p class="text-xs sm:text-sm text-[#7A866E] leading-relaxed">
          Đánh giá được chia sẻ trực tiếp bởi khách hàng đã trải nghiệm sản phẩm NutriMate.
        </p>
      </div>

      <p v-if="loadError" role="alert" class="rounded-2xl border border-red-200 bg-white p-5 text-sm text-red-700">
        {{ loadError }}
      </p>
      <p v-else-if="isLoading" role="status" class="rounded-2xl border border-[#E3E8DC] bg-white p-5 text-sm text-[#7A866E]">
        Đang tải đánh giá...
      </p>
      <p v-else-if="reviews.length === 0" class="rounded-2xl border border-[#E3E8DC] bg-white p-5 text-sm text-[#7A866E]">
        Sản phẩm chưa có đánh giá.
      </p>

      <div v-else class="testimonials-marquee" aria-label="Đánh giá của khách hàng">
        <div class="testimonials-track">
          <div
            v-for="copy in 2"
            :key="copy"
            class="testimonials-group"
            :aria-hidden="copy === 2 ? 'true' : undefined"
          >
            <article
              v-for="item in reviews"
              :key="`${copy}-${item.id}`"
              class="testimonial-card"
            >
              <div class="space-y-4">
                <div class="flex items-center gap-1 text-[#E8A020]" aria-label="Đánh giá sao">
                  <Star
                    v-for="star in 5"
                    :key="star"
                    class="h-4 w-4"
                    :class="star <= item.rating ? 'fill-[#E8A020]' : 'text-[#D7DDCF]'"
                  />
                </div>
                <p class="text-xs leading-relaxed text-[#3E4A2E] italic sm:text-sm">
                  "{{ item.content }}"
                </p>
              </div>

              <div class="flex items-center gap-3 border-t border-[#F0F3EC] pt-4">
                <div class="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EBF7E5] text-xs font-bold text-[#6B7A3A]">
                  <span>{{ item.author.slice(0, 2).toUpperCase() }}</span>
                  <img
                    v-if="item.avatarUrl && !failedAvatarIds.has(item.id)"
                    :src="item.avatarUrl"
                    :alt="`Ảnh đại diện của ${item.author}`"
                    class="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                    @error="markAvatarFailed(item.id)"
                  />
                </div>
                <div class="min-w-0">
                  <h4 class="truncate font-heading text-xs font-bold text-[#242424]">
                    {{ item.author }}
                  </h4>
                  <p class="truncate text-[11px] text-[#7A866E]">
                    {{ item.productName }}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.testimonials-marquee {
  overflow: hidden;
  mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
}

.testimonials-track {
  display: flex;
  width: max-content;
  animation: testimonials-scroll 36s linear infinite;
}

.testimonials-group {
  display: flex;
  flex: none;
  gap: 1.5rem;
  padding-right: 1.5rem;
}

.testimonial-card {
  display: flex;
  width: min(82vw, 440px);
  flex: none;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.5rem;
  border: 1px solid #e3e8dc;
  border-radius: 1.5rem;
  background: white;
  padding: 1.5rem;
  text-align: left;
  transition: border-color 180ms ease, box-shadow 180ms ease;
}

.testimonial-card:hover {
  border-color: #6b7a3a;
  box-shadow: 0 12px 28px rgb(45 59 30 / 12%);
}

.testimonials-marquee:hover .testimonials-track,
.testimonials-marquee:focus-within .testimonials-track {
  animation-play-state: paused;
}

@keyframes testimonials-scroll {
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .testimonials-track {
    animation: none;
  }

  .testimonials-group[aria-hidden='true'] {
    display: none;
  }
}
</style>
