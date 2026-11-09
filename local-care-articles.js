// Repository articles also appear in the managed car-care list without duplicating bodies.
export const airconArticle = {
  category: 'automotive-care', slug: 'aircon-check',
  title: '겨울에도 자동차 에어컨을 켜야 할까요? 유리창 김서림부터 에어컨 점검까지',
  summary: '겨울철 김서림과 에어컨 사용법, 냄새·약한 바람·냉방 불량의 점검 순서를 살펴봅니다.',
  content: '에어컨 이베포레이터 증발기 실내 필터 냉매',
  thumbnail_url: '/images/blog/aircon-check/cover.webp',
  published_at: '2026-11-04T00:00:00+09:00',
};
export const tireCareArticles = [
  {
    category: 'automotive-care', slug: 'tire-winter-pressure',
    title: '날씨 추워지면 왜 타이어 공기압 경고등이 뜰까요?',
    summary: '겨울철 공기압 변화와 TPMS 경고등, 차량별 권장 공기압 확인법을 안내합니다.',
    content: '겨울철 타이어 공기압 경고등 적정 수치 자가 점검',
    thumbnail_url: '/images/blog/tire-winter-pressure/cover.webp',
  },
  {
    category: 'automotive-care', slug: 'tire-replacement',
    title: '타이어, 언제 갈아야 할까요? 신품과 마모 타이어 비교',
    summary: '마모 한계선과 타이어 상태를 확인하고 교체 시기를 살펴봅니다.',
    content: '타이어 교체 시기 새 타이어 마모 한계선',
    thumbnail_url: '/images/blog/tire-replacement/cover.webp',
  },
];

export function withLocalCareArticles(posts = []) {
  const managedPosts = posts.filter(p => p.slug !== airconArticle.slug && !tireCareArticles.some(article => article.slug === p.slug));
  const pressureIndex = managedPosts.findIndex(p => p.slug === 'tire-pressure');
  const insertAt = pressureIndex === -1 ? managedPosts.length : pressureIndex + 1;
  managedPosts.splice(insertAt, 0, ...tireCareArticles);
  return [airconArticle, ...managedPosts];
}
