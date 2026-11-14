<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeft, ArrowRight, Bot, Leaf, Mail, Phone } from 'lucide-vue-next';
import { useChatStore } from '../stores/chatStore';

interface InfoSection {
  title: string;
  description: string;
  items?: string[];
}

interface InfoPage {
  eyebrow: string;
  title: string;
  description: string;
  sections: InfoSection[];
  actionLabel: string;
  actionTo?: string;
  actionType?: 'chat';
}

const route = useRoute();
const chatStore = useChatStore();

const pages: Record<string, InfoPage> = {
  partners: {
    eyebrow: 'Kết nối cùng NutriMate',
    title: 'Hệ thống đối tác',
    description: 'NutriMate chào đón các đơn vị cùng chia sẻ định hướng về thực phẩm chất lượng và lối sống lành mạnh.',
    sections: [
      {
        title: 'Cùng phát triển',
        description: 'Chúng tôi mong muốn kết nối với các nhà cung cấp thực phẩm, chuyên gia dinh dưỡng và đơn vị có giải pháp hỗ trợ chăm sóc sức khỏe.',
        items: ['Nhà cung cấp sản phẩm và nguyên liệu', 'Chuyên gia, đơn vị tư vấn dinh dưỡng', 'Đối tác công nghệ và cộng đồng sức khỏe'],
      },
      {
        title: 'Trao đổi hợp tác',
        description: 'Gửi giới thiệu về đơn vị, sản phẩm hoặc đề xuất hợp tác qua email. Đội ngũ NutriMate sẽ tiếp nhận và phản hồi theo thông tin liên hệ bạn cung cấp.',
      },
    ],
    actionLabel: 'Liên hệ hợp tác',
    actionTo: 'mailto:contact@nutrimate.vn?subject=De%20xuat%20hop%20tac%20NutriMate',
  },
  returns: {
    eyebrow: 'Hỗ trợ đơn hàng',
    title: 'Chính sách đổi trả',
    description: 'NutriMate hỗ trợ tiếp nhận yêu cầu khi sản phẩm giao không đúng hoặc gặp vấn đề trong quá trình vận chuyển.',
    sections: [
      {
        title: 'Khi cần hỗ trợ',
        description: 'Vui lòng kiểm tra sản phẩm khi nhận hàng. Nếu đơn hàng bị giao sai, thiếu hoặc sản phẩm có dấu hiệu hư hỏng, hãy liên hệ đội ngũ hỗ trợ để được hướng dẫn.',
        items: ['Cung cấp mã đơn hàng và thông tin người nhận', 'Mô tả tình trạng sản phẩm và yêu cầu hỗ trợ', 'Gửi hình ảnh sản phẩm/bao bì nếu có để việc xác minh thuận tiện hơn'],
      },
      {
        title: 'Tiếp nhận và xử lý',
        description: 'Mỗi yêu cầu sẽ được kiểm tra theo tình trạng đơn hàng và sản phẩm thực tế. Phương án hỗ trợ cụ thể sẽ được xác nhận với khách hàng trước khi thực hiện.',
      },
    ],
    actionLabel: 'Đến trung tâm trợ giúp',
    actionTo: '/help',
  },
  privacy: {
    eyebrow: 'Quyền riêng tư',
    title: 'Chính sách bảo vệ dữ liệu',
    description: 'NutriMate sử dụng thông tin cần thiết để vận hành tài khoản, đơn hàng và các tính năng dinh dưỡng mà bạn lựa chọn.',
    sections: [
      {
        title: 'Thông tin được sử dụng',
        description: 'Tùy theo tính năng bạn sử dụng, hệ thống có thể xử lý thông tin hồ sơ và liên hệ, lịch sử đơn hàng, đánh giá sản phẩm, dữ liệu sức khỏe bạn nhập và nội dung trao đổi với NutriBot.',
      },
      {
        title: 'Mục đích sử dụng',
        description: 'Thông tin được dùng để cung cấp dịch vụ, hỗ trợ đơn hàng, cá nhân hóa trải nghiệm và phản hồi các yêu cầu của bạn. Dữ liệu sức khỏe chỉ phục vụ các tính năng dinh dưỡng liên quan; không nhập thông tin không cần thiết vào cuộc trò chuyện.',
      },
      {
        title: 'Quản lý thông tin',
        description: 'Bạn có thể cập nhật một số thông tin hồ sơ trong tài khoản hoặc liên hệ NutriMate để được hỗ trợ về dữ liệu cá nhân. Khi gửi yêu cầu, vui lòng dùng email đã đăng ký để thuận tiện xác minh.',
      },
    ],
    actionLabel: 'Liên hệ về dữ liệu',
    actionTo: 'mailto:contact@nutrimate.vn?subject=Yeu%20cau%20ve%20du%20lieu%20ca%20nhan',
  },
  terms: {
    eyebrow: 'Thông tin sử dụng',
    title: 'Điều khoản dịch vụ',
    description: 'Khi sử dụng NutriMate, bạn đồng ý cung cấp thông tin chính xác và sử dụng các tính năng phù hợp với mục đích cá nhân.',
    sections: [
      {
        title: 'Tài khoản và đơn hàng',
        description: 'Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và cập nhật thông tin nhận hàng chính xác. Giá, tồn kho và thông tin sản phẩm được hiển thị tại thời điểm đặt hàng.',
      },
      {
        title: 'Thông tin dinh dưỡng',
        description: 'Nội dung dinh dưỡng và gợi ý từ NutriBot chỉ nhằm mục đích tham khảo, không thay thế chẩn đoán hoặc tư vấn từ bác sĩ/chuyên gia. Hãy hỏi chuyên gia y tế khi có tình trạng sức khỏe đặc biệt.',
      },
      {
        title: 'Sử dụng dịch vụ',
        description: 'Không sử dụng hệ thống để gửi nội dung trái pháp luật, gây ảnh hưởng đến người khác hoặc làm gián đoạn hoạt động của dịch vụ. NutriMate có thể cập nhật tính năng nhằm cải thiện trải nghiệm.',
      },
    ],
    actionLabel: 'Tìm hiểu chính sách dữ liệu',
    actionTo: '/privacy',
  },
  'nutribot-guide': {
    eyebrow: 'Hướng dẫn sử dụng',
    title: 'Trò chuyện cùng NutriBot',
    description: 'NutriBot hỗ trợ tra cứu thông tin và gợi ý dinh dưỡng dựa trên mục tiêu, khẩu vị và nhu cầu bạn chia sẻ.',
    sections: [
      {
        title: 'Cách đặt câu hỏi',
        description: 'Nêu rõ mục tiêu và bối cảnh để nhận gợi ý phù hợp hơn. Bạn có thể hỏi về sản phẩm, thành phần, lựa chọn bữa ăn hoặc cách xây dựng thói quen lành mạnh.',
        items: ['Chia sẻ mục tiêu như ăn cân bằng hoặc kiểm soát năng lượng', 'Nêu dị ứng, thực phẩm muốn tránh hoặc chế độ ăn đang theo', 'Đặt câu hỏi cụ thể và kiểm tra lại thông tin quan trọng'],
      },
      {
        title: 'Lưu ý sức khỏe',
        description: 'Câu trả lời của NutriBot mang tính tham khảo, không thay thế tư vấn y tế. Không chia sẻ thông tin cá nhân nhạy cảm; nếu bạn có bệnh lý hoặc đang điều trị, hãy trao đổi với chuyên gia y tế.',
      },
    ],
    actionLabel: 'Mở NutriBot',
    actionType: 'chat',
  },
  help: {
    eyebrow: 'Chúng tôi sẵn sàng hỗ trợ',
    title: 'Trung tâm trợ giúp',
    description: 'Liên hệ NutriMate để được hỗ trợ về tài khoản, sản phẩm, đơn hàng hoặc các tính năng dinh dưỡng.',
    sections: [
      {
        title: 'Hỗ trợ đơn hàng',
        description: 'Để chúng tôi tra cứu nhanh, vui lòng cung cấp mã đơn hàng cùng email hoặc số điện thoại dùng khi đặt hàng.',
      },
      {
        title: 'Thông tin liên hệ',
        description: 'Gửi câu hỏi qua email hoặc gọi hotline trong giờ làm việc. Không gửi mật khẩu hoặc thông tin thanh toán đầy đủ qua các kênh hỗ trợ.',
        items: ['Email: contact@nutrimate.vn', 'Hotline: 1900 6767'],
      },
    ],
    actionLabel: 'Gửi email hỗ trợ',
    actionTo: 'mailto:contact@nutrimate.vn?subject=Ho%20tro%20khach%20hang%20NutriMate',
  },
};

const page = computed(() => pages[String(route.name)] ?? pages.help);

function openChat() {
  chatStore.openChat();
}
</script>

<template>
  <main class="min-h-[60vh] bg-[#F7F3E8] px-4 py-8 sm:px-8 sm:py-12">
    <div class="mx-auto max-w-5xl">
      <nav class="mb-5 flex items-center gap-2 text-xs font-medium text-[#7A866E]" aria-label="Điều hướng">
        <RouterLink to="/" class="transition hover:text-[#3B4E24]">Trang chủ</RouterLink>
        <span aria-hidden="true">/</span>
        <span class="font-semibold text-[#3B4E24]">{{ page.title }}</span>
      </nav>

      <header class="relative overflow-hidden rounded-3xl border border-[#CCD7BC] bg-[#C0C59F] p-6 shadow-sm sm:p-9">
        <div class="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/25 blur-3xl"></div>
        <div class="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-white/75 text-[#3B4E24] shadow-sm">
            <Leaf class="h-7 w-7" />
          </div>
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.16em] text-[#3B4E24]">{{ page.eyebrow }}</p>
            <h1 class="mt-2 font-heading text-3xl font-black tracking-tight text-[#242424] sm:text-4xl">{{ page.title }}</h1>
            <p class="mt-3 max-w-3xl text-sm leading-7 text-[#3E4A2E] sm:text-base">{{ page.description }}</p>
          </div>
        </div>
      </header>

      <div class="mt-6 grid gap-4 md:grid-cols-2">
        <section
          v-for="(section, index) in page.sections"
          :key="section.title"
          class="rounded-3xl border border-[#E3E8DC] bg-white p-5 shadow-2xs transition-shadow hover:shadow-sm sm:p-7"
        >
          <div class="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0F4EA] font-heading text-sm font-black text-[#536124]">
            {{ String(index + 1).padStart(2, '0') }}
          </div>
          <h2 class="font-heading text-lg font-bold text-[#2D3B1E]">{{ section.title }}</h2>
          <p class="mt-2 text-sm leading-7 text-[#576449]">{{ section.description }}</p>
          <ul v-if="section.items" class="mt-4 space-y-2.5 text-sm leading-6 text-[#576449]">
            <li v-for="item in section.items" :key="item" class="flex gap-2.5">
              <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6B7A3A]"></span>
              <span>{{ item }}</span>
            </li>
          </ul>
        </section>
      </div>

      <div class="mt-6 flex flex-col gap-3 rounded-3xl border border-[#D5DFC8] bg-[#F0F4EA] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p class="font-heading text-base font-bold text-[#2D3B1E]">Bạn cần thêm thông tin?</p>
          <p class="mt-1 text-xs leading-relaxed text-[#576449] sm:text-sm">Đội ngũ NutriMate sẵn sàng hỗ trợ các thắc mắc của bạn.</p>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row">
        <button
          v-if="page.actionType === 'chat'"
          type="button"
          class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#4D6A34] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#3B4E24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8EA675] focus-visible:ring-offset-2"
          @click="openChat"
        >
          <Bot class="h-4 w-4" />
          {{ page.actionLabel }}
        </button>
        <a
          v-else-if="page.actionTo?.startsWith('mailto:')"
          :href="page.actionTo"
          class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#4D6A34] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#3B4E24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8EA675] focus-visible:ring-offset-2"
        >
          <Mail class="h-4 w-4" />
          {{ page.actionLabel }}
        </a>
        <RouterLink
          v-else
          :to="page.actionTo || '/help'"
          class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#4D6A34] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#3B4E24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8EA675] focus-visible:ring-offset-2"
        >
          {{ page.actionLabel }}
          <ArrowRight class="h-4 w-4" />
        </RouterLink>
        <a
          href="tel:19006767"
          class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#CCD7BC] bg-white px-5 py-3 text-sm font-bold text-[#3B4E24] transition hover:-translate-y-0.5 hover:bg-[#F0F4EA]"
        >
          <Phone class="h-4 w-4" />
          Gọi hotline
        </a>
        </div>
      </div>
    </div>
  </main>
</template>
