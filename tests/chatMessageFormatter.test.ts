import assert from 'node:assert/strict';
import test from 'node:test';
import { formatChatMessage } from '../src/utils/chatMessageFormatter.js';

test('formats markdown recommendation tables as readable product details', () => {
  const answer = [
    'Gợi ý món ăn giảm cân (dựa trên sản phẩm có trong danh sách):',
    '',
    '| Món ăn | Thành phần chính | Lợi ích giảm cân |',
    '|--------|------------------|------------------|',
    '| Bún Nưa Shirataki xào rau củ | Bún Nưa Shirataki, rau củ | Chất xơ cao, calo thấp, cảm giác no lâu |',
    '| Salad bún Nưa Shirataki | Bún Nưa, rau xanh | Kết hợp protein, chất xơ, chất béo lành mạnh |',
  ].join('\n');

  assert.equal(formatChatMessage(answer), [
    'Gợi ý món ăn giảm cân (dựa trên sản phẩm có trong danh sách):',
    '',
    '• Bún Nưa Shirataki xào rau củ',
    '  Thành phần chính: Bún Nưa Shirataki, rau củ',
    '  Lợi ích giảm cân: Chất xơ cao, calo thấp, cảm giác no lâu',
    '',
    '• Salad bún Nưa Shirataki',
    '  Thành phần chính: Bún Nưa, rau xanh',
    '  Lợi ích giảm cân: Kết hợp protein, chất xơ, chất béo lành mạnh',
  ].join('\n'));
});

test('keeps regular replies readable and collapses repeated disclaimers', () => {
  const disclaimer = 'Thông tin chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ hoặc chuyên gia dinh dưỡng.';
  assert.equal(formatChatMessage(`**Bạn có thể thử món này.**\n\n${disclaimer}\n${disclaimer}`), `Bạn có thể thử món này.\n\n${disclaimer}`);
});
