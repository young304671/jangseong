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

export const transmissionCareArticle = {
  category: 'automotive-care', slug: 'transmission-oil-exchange',
  title: '미션오일, 어떻게 교환할까요? 순환식 교환 7단계',
  summary: '오토 힐러 장비를 사용한 순환식 미션오일 교환 과정과 차량별 교환주기를 살펴봅니다.',
  content: [
    '## 교환 시기는 차량 설명서에서 확인하세요',
    '미션오일(자동변속기 오일)의 교환 기준은 차종과 변속기, 운행 조건에 따라 달라집니다. 차량 설명서의 일반 조건과 가혹 조건을 함께 살펴보세요.',
    '## 교환 방식은 차량에 맞춰 선택합니다',
    '드레인 방식은 플러그를 열어 오일을 배출하고, 순환식은 장비로 새 오일을 공급하면서 기존 오일을 배출합니다. 차량에 맞는 오일 규격과 정비 절차를 먼저 확인합니다.',
    '## 방문할 때 알려주세요',
    '차종과 연식, 주행거리, 최근 교환 이력을 알려주세요. 변속이 늦거나 충격이 느껴진다면 언제 증상이 나타나는지도 함께 알려주시면 점검에 도움이 됩니다.',
  ].join('\n\n'),
  thumbnail_url: '/board-images/transmission-care.webp',
};

export const linkedCareArticles = [...tireCareArticles, transmissionCareArticle];

export function withLocalCareArticles(posts = []) {
  const managedPosts = posts.filter(p => p.slug !== airconArticle.slug && !linkedCareArticles.some(article => article.slug === p.slug));
  const pressureIndex = managedPosts.findIndex(p => p.slug === 'tire-pressure');
  const insertAt = pressureIndex === -1 ? managedPosts.length : pressureIndex + 1;
  managedPosts.splice(insertAt, 0, ...linkedCareArticles);
  return [airconArticle, ...managedPosts];
}
