const imagePath = '/board-images/k5-coolant/';

export const k5CoolantCase = {
  category: 'repair-case',
  slug: 'k5-coolant-exchange',
  title: '145,000km 주행한 K5, 순환식 냉각수 교환',
  summary: '냉각수 교환 시기가 된 K5에 고객님이 직접 준비해 오신 부동액을 사용해 순환식으로 교환했습니다.',
  thumbnail_url: imagePath + 'case-cover-aligned.webp',
  images: ['customer-coolant.webp', 'filling-machine.webp', 'exchange-machine.webp', 'exchange-in-progress.webp'].map(name => imagePath + name),
  content: [
    '## 방문 이유',
    '주행거리 145,000km인 K5입니다. 고객님은 냉각수 교환 시기가 되어 직접 구입한 부동액을 가지고 방문하셨습니다.',
    '## 순환식 냉각수 교환',
    '순환식 교환기를 차량의 냉각 라인에 연결했습니다. 장비로 기존 냉각수를 회수하고 고객님이 준비해 오신 부동액으로 교환했습니다.',
  ].join('\n\n'),
};
