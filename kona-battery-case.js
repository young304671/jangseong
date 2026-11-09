const imagePath = '/board-images/kona-battery/';

export const konaBatteryCase = {
  category: 'repair-case',
  slug: 'battery-inspection',
  title: '신호대기 중 시동이 꺼진 2023년식 코나, 배터리 점검과 첫 교체',
  summary: '약 40,000km를 주행한 코나의 기존 배터리에서 낮은 전압을 확인하고, 출고 후 처음으로 배터리를 교체한 사례입니다.',
  thumbnail_url: imagePath + 'cover.webp',
  images: ['low-voltage.webp', 'comparison.webp', 'recheck.webp', 'recheck-display.webp'].map(name => imagePath + name),
  content: [
    '## 신호대기 중 시동이 꺼졌어요',
    '고객님은 신호를 기다리던 중 시동이 꺼졌고, 계기판에 배터리 모양 경고등이 보였다고 하셨습니다. 신호가 초록불로 바뀌고 뒤에서 경적이 울려 많이 당황하셨다고 해요. 비상등을 켤 수 있었고, 다시 시동을 걸자 엔진이 작동해 바로 장성카센터에 오셨습니다.',
    '## 기존 배터리에서 확인한 내용',
    '기존 배터리에 점검기를 연결하니 화면에 ‘전압 너무 낮음’이 표시됐습니다. 방문 후 확인한 저전압과 재시동이 됐다는 사실만으로는 당시 시동이 꺼진 원인을 확정하기 어렵습니다.',
    '## 출고 후 첫 배터리 교체',
    '고객님은 신차 구입 후 배터리를 교체한 적이 없다고 하셨습니다. 이번에 델코 AGM LN3 배터리로 교체했고, 장착 후에는 점검기를 연결해 새 배터리 상태를 다시 확인했습니다.',
  ].join('\n\n'),
};

export function withKonaBatteryCase(posts = []) {
  return [konaBatteryCase, ...posts.filter(post => post.slug !== konaBatteryCase.slug)];
}
