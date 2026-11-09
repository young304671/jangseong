export const winterInspectionNews = {
  category: 'news',
  slug: 'seasonal-inspection',
  title: '겨울철 차량 점검 안내 | 타이어·배터리·앞유리',
  summary: '추워지기 전에 타이어 공기압과 마모, 배터리 상태, 와이퍼·워셔액과 앞유리 김서림을 살펴보세요.',
  thumbnail_url: '/board-images/tire-valve/6.webp',
  published_at: '2026-11-09T00:00:00+09:00',
  images: [],
  content: [
    '겨울을 앞두고 장성카센터에서 미리 살펴볼 차량 점검 항목 세 가지를 안내합니다.',
    '## 타이어 공기압과 마모',
    '공기압 경고등이 켜졌거나 보충한 뒤 같은 바퀴의 공기압이 다시 낮아졌다면 그 증상을 알려주세요. 타이어의 공기압과 마모 상태를 함께 살펴봅니다.',
    '## 배터리 상태',
    '아침 첫 시동이 평소보다 힘겹게 걸리거나 방전이 반복됐다면 배터리 상태를 점검해 보세요.',
    '## 와이퍼·워셔액과 앞유리 김서림',
    '와이퍼가 지나간 자리에 줄이 남는지, 워셔액이 충분한지, 앞유리 김서림 제거 기능이 잘 작동하는지 확인해 보세요.',
    '## 예약 문의',
    '정비 항목을 정확히 몰라도 괜찮습니다. 차량 증상을 알려주시면 필요한 점검부터 순서대로 안내해드립니다.',
  ].join('\n\n'),
};

export function withWinterInspectionNews(posts) {
  if (posts.some(post => post.slug === winterInspectionNews.slug)) {
    return posts.map(post => post.slug === winterInspectionNews.slug ? winterInspectionNews : post);
  }
  return [...posts, winterInspectionNews];
}
