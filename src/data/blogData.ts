export interface ArticleAuthor {
  name: string;
  title: string;
  avatar: string;
  hospital: string;
}

export interface NutritionistArticle {
  id: string;
  title: string;
  slug: string;
  category: 'weight_loss' | 'low_carb' | 'sugar_free';
  categoryLabel: string;
  readTime: string;
  publishedDate: string;
  author: ArticleAuthor;
  thumbnail: string;
  excerpt: string;
  keyTakeaways: string[];
  contentParagraphs: string[];
  recommendedProductIds: string[];
}

export const NUTRITIONIST_ARTICLES: NutritionistArticle[] = [
  {
    id: 'art-1',
    title: 'Chiến Lược Thâm Hụt Calo Bền Vững: Giảm Mỡ Tự Nhiên Mà Không Mất Cơ',
    slug: 'chien-luoc-tham-hut-calo-ben-vung',
    category: 'weight_loss',
    categoryLabel: 'Khoa Học Đốt Mỡ',
    readTime: '4 phút đọc',
    publishedDate: '16/09/2026',
    author: {
      name: 'ThS. BS. Nguyễn Minh Châu',
      title: 'Chuyên gia Dinh dưỡng Lâm sàng & Y học Thể thao',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80',
      hospital: 'Viện Dinh Dưỡng Lâm Sàng TP.HCM',
    },
    thumbnail: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80',
    excerpt: 'Nhịn ăn cực đoan khiến cơ thể chuyển sang trạng thái "sinh tồn", đốt cơ bắp thay vì mỡ. Bí quyết là thâm hụt thông minh 300 - 500 kcal kèm tỷ lệ đạm cao.',
    keyTakeaways: [
      'Không bao giờ giảm calo dưới mức BMR (chuyển hóa cơ bản) của cơ thể.',
      'Duy trì tối thiểu 1.6g Protein / kg thể trọng để kích thích tái tạo sợi cơ.',
      'Tận dụng chất xơ từ Konjac để làm đầy dạ dày cơ học mà không nạp năng lượng rỗng.',
    ],
    contentParagraphs: [
      'Nhiều người lầm tưởng rằng càng ăn ít thì cân nặng giảm càng nhanh. Tuy nhiên, khi mức thâm hụt vượt quá 30% tổng năng lượng tiêu hao (TDEE), tuyến giáp sẽ giảm sản xuất hormone T3, làm chậm quá trình trao đổi chất cơ bản.',
      'Thay vì cắt giảm bừa bãi, công thức chuẩn y khoa khuyến nghị tạo thâm hụt đều đặn 400-500 kcal mỗi ngày. Ở mức này, bạn sẽ giảm trung bình 0.5kg mỡ tinh khiết mỗi tuần mà không hề cảm thấy kiệt sức hay thèm ăn.',
      'Đặc biệt, việc chia nhỏ bữa ăn và kết hợp ức gà sous-vide hoặc protein bar vào các bữa phụ giúp nồng độ axit amin trong huyết tương luôn ổn định, ngăn chặn hoàn toàn hiện tượng teo cơ.',
    ],
    recommendedProductIds: ['prod-2', 'prod-4', 'prod-5'],
  },
  {
    id: 'art-2',
    title: 'Phân Biệt Carbs Chậm & Carbs Nhanh: Chìa Khóa Cho Người Ăn Low-Carb & Keto',
    slug: 'phan-biet-carbs-cham-va-carbs-nhanh',
    category: 'low_carb',
    categoryLabel: 'KETO & Low-Carb',
    readTime: '3 phút đọc',
    publishedDate: '12/09/2026',
    author: {
      name: 'ThS. BS. Nguyễn Minh Châu',
      title: 'Chuyên gia Dinh dưỡng Lâm sàng & Y học Thể thao',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80',
      hospital: 'Viện Dinh Dưỡng Lâm Sàng TP.HCM',
    },
    thumbnail: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    excerpt: 'Không phải mọi loại tinh bột đều xấu. Tìm hiểu cách chỉ số Net Carbs giúp bạn tận hưởng bánh mì hạnh nhân và ngũ cốc nguyên hạt mà vẫn giữ trạng thái đốt mỡ.',
    keyTakeaways: [
      'Công thức tính Net Carbs: Tổng Carbohydrate trừ đi Lượng Chất Xơ (Fiber).',
      'Carb tinh chế (cơm trắng, đường) làm tăng vọt đường huyết và tích tụ mỡ bụng.',
      'Bột hạnh nhân và hạt lanh cung cấp chất béo không bão hòa đơn có lợi cho tim mạch.',
    ],
    contentParagraphs: [
      'Khi theo đuổi chế độ ăn Low-Carb hoặc KETO, nhiều bạn cảm thấy ám ảnh và kiêng khem toàn bộ các món bánh. Đó là một sai lầm phổ biến vì chất xơ tự nhiên không bị cơ thể phân giải thành glucose.',
      'Chẳng hạn, một lát bánh mì nguyên cám keto của NutriMate chứa 7.6g tổng carbohydrate, nhưng có đến 4.8g là chất xơ. Như vậy lượng Net Carb thực tế bạn hấp thụ chỉ có 2.8g — hoàn toàn an toàn cho trạng thái ketosis.',
      'Hãy ưu tiên các loại hạt giàu Omega-3 như hạnh nhân, óc chó và hạt lanh thay cho các loại tinh bột rỗng để bảo vệ sức khỏe tim mạch và duy trì năng lượng bền bỉ suốt ngày dài.',
    ],
    recommendedProductIds: ['prod-1', 'prod-8', 'prod-4'],
  },
  {
    id: 'art-3',
    title: 'Tại Sao 0g Đường Tinh Luyện Là Bước Đi Quan Trọng Nhất Cho Làn Da & Vóc Dáng?',
    slug: 'tai-sao-0g-duong-tinh-luyen-quan-trong',
    category: 'sugar_free',
    categoryLabel: 'Kiểm Soát Đường Huyết',
    readTime: '5 phút đọc',
    publishedDate: '08/09/2026',
    author: {
      name: 'ThS. BS. Nguyễn Minh Châu',
      title: 'Chuyên gia Dinh dưỡng Lâm sàng & Y học Thể thao',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80',
      hospital: 'Viện Dinh Dưỡng Lâm Sàng TP.HCM',
    },
    thumbnail: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80',
    excerpt: 'Đường mía tinh luyện là nguyên nhân hàng đầu gây ra phản ứng Glycation (đường hóa làm gãy collagen) và kích hoạt tích mỡ nội tạng khó tan.',
    keyTakeaways: [
      'Cắt giảm đường giúp da sáng khỏe, giảm viêm mụn và ngăn ngừa lão hóa sớm.',
      'Insulin ổn định sẽ kích hoạt enzym Lipase phân giải mô mỡ dự trữ.',
      'Chiết xuất cỏ ngọt tự nhiên Stevia thỏa mãn vị giác ngọt mà không kích thích đường huyết.',
    ],
    contentParagraphs: [
      'Hiện tượng "Sugar Crash" (tụt năng lượng sau khi ăn ngọt) là lý do khiến bạn cảm thấy uể oải lúc 3 giờ chiều. Khi nạp đường tinh luyện, tuyến tụy buộc phải bơm một lượng lớn insulin để hạ đường huyết khẩn cấp, đẩy cơ thể vào trạng thái mệt mỏi và thèm đồ ngọt tiếp theo.',
      'Tại NutriMate, toàn bộ dòng sản phẩm Sugar-Free sử dụng vị ngọt thanh thuần khiết từ lá cỏ ngọt Stevia hữu cơ và la hán quả. Các glycosid tự nhiên này đi qua hệ tiêu hóa mà không chuyển hóa thành calo, giữ đường huyết êm dịu phẳng lặng.',
      'Sau 14 ngày loại bỏ đường tinh luyện, bạn sẽ nhận thấy rõ rệt vùng mỡ bụng mềm hơn, tinh thần minh mẫn hơn và tình trạng viêm đỏ trên da cải thiện bất ngờ.',
    ],
    recommendedProductIds: ['prod-3', 'prod-6', 'prod-9'],
  },
];
