// Repository articles also appear in the managed car-care list without duplicating bodies.
export const airconArticle = {
  category: 'automotive-care', slug: 'aircon-check',
  title: '겨울에도 자동차 에어컨을 켜야 할까요? 유리창 김서림부터 에어컨 점검까지',
  summary: '겨울철 김서림과 에어컨 사용법, 냄새·약한 바람·냉방 불량의 점검 순서를 살펴봅니다.',
  content: '에어컨 이베포레이터 증발기 실내 필터 냉매',
  thumbnail_url: '/images/blog/aircon-check/cover.webp',
  published_at: '2026-11-04T00:00:00+09:00',
};
export function withLocalCareArticles(posts = []) {
  return [airconArticle, ...posts.filter(p => p.slug !== airconArticle.slug)];
}
