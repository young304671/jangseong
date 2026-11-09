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

export const wallStory = {
  category: 'news',
  slug: 'a-sentence-on-our-wall',
  title: '장성카센터 벽에 걸린 한 문장',
  summary: '벽에 걸린 글귀와 두 손도장, 그리고 아들과 직원이 정비 교육을 다녀온 이야기입니다.',
  thumbnail_url: '/board-images/wall-story/cover-focused.webp',
  published_at: '2026-11-09T17:40:00+09:00',
  images: ['/board-images/wall-story/1001.webp', '/board-images/wall-story/1008.webp'],
  content: [
    '장성카센터 벽에는 오래전 메모해 둔 글귀가 작품이 되어 걸려 있습니다.',
    '“자동차는 지상 최고의 유행상품이다. 그 유행에 맞추어 공부를 지속해야 한다.”',
    '자동차가 계속 달라지니 정비하는 사람도 그 변화에 맞춰 꾸준히 배워야 한다는 뜻입니다. 이 글귀에 담긴 이야기를 한 캘리그라퍼 작가님께 전했더니, 흔쾌히 작품으로 써주셨습니다.',
    '글귀 옆에는 아버지와 아들이 마주 보고 찍은 손도장이 있습니다. 아들에게는 아버지가 정비 일을 하며 지켜온 생각을 전하는 뜻으로, 아버지에게는 아들을 믿고 응원하는 마음으로 남긴 손도장입니다.',
    '## 벽에 걸린 말을 일터에서 지켜가는 일',
    '글귀를 걸고 나니 그 말을 일터에서 어떻게 지켜갈지 더 자주 생각하게 됐습니다. 바쁜 일과 중에도 시간을 내어 새 기술을 배우고, 현장에서 마주한 질문을 다시 공부하는 일이 쌓여 가게의 철학이 된다고 생각합니다.',
    '지금 장성카센터는 2대 경영을 이어가고 있습니다. 아들은 아버지에 이어 장성카센터에서 자신의 역할을 하나씩 만들어가고 있습니다. 지난 10월에는 아들에 이어 함께 일하는 직원도 정비 교육을 이수하고 돌아왔습니다. 두 사람은 충북 청주에서 각각 한 차례씩 4박 5일 일정으로 교육을 받았습니다.',
    '## 2026년 10월 정비 교육 기록',
    '10월 1일~5일 · 충북 청주시 · 자동차정비기술 신규교육 중 기본교육 및 고전원 전기장치 심화교육 (37시간)',
    '10월 7일 · 대전 서구 · 한국지엠 정비교육',
    '10월 8일~12일 · 충북 청주시 · 자동차정비기술 신규교육 중 기본교육 및 고전원 전기장치 특화교육 (41시간)',
    '자동차가 달라질수록 저희도 꾸준히 배우겠습니다. 고객님이 겪으신 증상부터 듣고, 차량 상태를 확인한 뒤 필요한 정비를 안내하는 기본도 지켜가겠습니다.',
    '## 정비기술교육 수료증',
    '10월 1일~5일 심화교육과 10월 8일~12일 특화교육 수료증입니다.',
  ].join('\n\n'),
};

export function withLocalNews(posts) {
  const existing = posts.some(post => post.slug === winterInspectionNews.slug);
  const updated = posts.filter(post => post.slug !== wallStory.slug)
    .map(post => post.slug === winterInspectionNews.slug ? winterInspectionNews : post);
  if (!existing) updated.push(winterInspectionNews);
  updated.splice(1, 0, wallStory);
  return updated;
}
