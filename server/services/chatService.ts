import { ChatResponseData, Product } from '../types/index.js';
import * as chatRepo from '../repositories/chatRepository.js';
import * as productRepo from '../repositories/productRepository.js';

export async function processUserMessage(message: string): Promise<ChatResponseData> {
  const cleanMsg = (message || '').toLowerCase().trim();
  const knowledgeList = await chatRepo.getAllKnowledge();

  // 1. Kiểm tra các mẫu từ khóa trong tri thức
  for (const item of knowledgeList) {
    const hasMatch = item.keywordPatterns.some((pattern) => cleanMsg.includes(pattern.toLowerCase()));
    if (hasMatch) {
      let suggested: Product[] = [];
      if (item.recommendedCategory) {
        const prods = await productRepo.findProducts({ category: item.recommendedCategory });
        suggested = prods.slice(0, 3);
      }
      return {
        reply: item.answerTemplate,
        suggestedProducts: suggested,
        intent: item.intentTag,
      };
    }
  }

  // 2. Nhận diện tính calo từ chiều cao / cân nặng
  const weightMatch = cleanMsg.match(/(\d{2,3})\s*(kg|kí|cân)/);
  const heightMatch = cleanMsg.match(/(\d{2,3})\s*(cm|m\d{1,2})/);

  if (weightMatch || heightMatch) {
    const prods = await productRepo.findProducts({ category: 'low-carb' });
    return {
      reply: 'Tuyệt vời! Dựa trên chỉ số thể trạng của bạn, NutriMate đề xuất lộ trình dinh dưỡng giảm mỡ tăng cơ: kiểm soát lượng calo nạp vào thấp hơn 300 - 500 kcal so với TDEE, ưu tiên thực phẩm giàu đạm (ức gà, thanh hạt protein) và chuyển đổi sang tinh bột thông minh (bún nưa Konjac, bánh mì nguyên cám).',
      suggestedProducts: prods.slice(0, 2),
      intent: 'body_stat_advisory',
    };
  }

  // 3. Fallback tư vấn mặc định thân thiện
  const defaultProds = await productRepo.findProducts({});
  const featured = defaultProds.filter((p) => p.isFeatured).slice(0, 2);

  return {
    reply: 'Chào bạn! Mình là NutriBot — Chuyên viên tư vấn dinh dưỡng của NutriMate. Bạn có thể hỏi mình về chế độ Low-Carb, thực đơn High-Protein cho gymer, sản phẩm Sugar-Free cho người kiêng đường, hoặc nhập chiều cao/cân nặng để mình tư vấn lộ trình phù hợp nhé!',
    suggestedProducts: featured,
    intent: 'general_greeting',
  };
}
