import { ChatResponseData, Product } from '../types/index.js';
import * as chatRepo from '../repositories/chatRepository.js';
import * as productRepo from '../repositories/productRepository.js';

const knowledgeStopWords = new Set([
  'and', 'ban', 'cho', 'co', 'cua', 'de', 'for', 'gi', 'giup', 'hay', 'how',
  'la', 'lam', 'nao', 'nhu', 'sao', 'the', 'toi', 'va', 've', 'voi', 'what',
]);
const productCategories = new Set(['all', 'low-carb', 'high-protein', 'sugar-free']);

function normalizeSearchText(value: string): string {
  return value
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

function getSearchTerms(value: string): string[] {
  return (normalizeSearchText(value).match(/[\p{L}\p{N}]+/gu) ?? [])
    .filter((term) => term.length >= 3 && !knowledgeStopWords.has(term));
}

function findKnowledgeMatch(message: string, entries: Awaited<ReturnType<typeof chatRepo.getAllKnowledge>>) {
  const messageTerms = new Set(getSearchTerms(message));
  const normalizedMessage = normalizeSearchText(message);
  let bestMatch: (typeof entries)[number] | undefined;
  let bestScore = 0;

  for (const entry of entries) {
    if (!entry.question || !entry.answer) continue;

    const question = normalizeSearchText(entry.question).trim();
    if (question.length >= 3 && normalizedMessage.includes(question)) {
      return entry;
    }

    const questionTerms = getSearchTerms(question);
    const overlap = questionTerms.filter((term) => messageTerms.has(term));
    const singleTermMatch = overlap[0];
    if (overlap.length < 2 && !(overlap.length === 1 && questionTerms.length <= 2 && singleTermMatch && singleTermMatch.length >= 5)) {
      continue;
    }

    const score = overlap.length / questionTerms.length;
    if (score > bestScore) {
      bestMatch = entry;
      bestScore = score;
    }
  }

  return bestMatch;
}

export async function processUserMessage(message: string): Promise<ChatResponseData> {
  const cleanMsg = (message || '').toLowerCase().trim();
  const knowledgeList = await chatRepo.getAllKnowledge();
  const knowledgeMatch = findKnowledgeMatch(cleanMsg, knowledgeList);
  if (knowledgeMatch?.answer) {
    let suggested: Product[] = [];
    if (knowledgeMatch.category && productCategories.has(knowledgeMatch.category)) {
      const prods = await productRepo.findProducts({ category: knowledgeMatch.category });
      suggested = prods.slice(0, 3);
    }
    return {
      reply: knowledgeMatch.answer,
      suggestedProducts: suggested,
      intent: knowledgeMatch.category ?? 'knowledge_base',
    };
  }

  // 1. Nhận diện tính calo từ chiều cao / cân nặng
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

  // 2. Fallback tư vấn mặc định thân thiện
  const defaultProds = await productRepo.findProducts({});
  const featured = defaultProds.filter((p) => p.isFeatured).slice(0, 2);

  return {
    reply: 'Chào bạn! Mình là NutriBot — Chuyên viên tư vấn dinh dưỡng của NutriMate. Bạn có thể hỏi mình về chế độ Low-Carb, thực đơn High-Protein cho gymer, sản phẩm Sugar-Free cho người kiêng đường, hoặc nhập chiều cao/cân nặng để mình tư vấn lộ trình phù hợp nhé!',
    suggestedProducts: featured,
    intent: 'general_greeting',
  };
}
