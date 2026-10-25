// Confirmed information shared by Home and Contact. Omit unconfirmed details.
export const visitInfo = {
  "address": "제주특별자치도 제주시 용해로 115",
  "hours": [
    "평일 08:30~17:30",
    "평일 점심시간 12:00~13:00",
    "토요일 08:30~12:00",
    "휴무일 일요일·공휴일"
  ],
  "guidance": [
    [
      "원활한 정비를 위해 방문 전 전화 또는 예약 문의를 부탁드립니다.",
      "차량 증상과 필요한 정비를 미리 알려주시면 방문 일정을 안내해드립니다."
    ],
    [
      "평일 점검·수리를 위해서는 오후 5시까지 방문해 주세요.",
      "정비 항목에 따라 당일 작업 가능 여부가 달라질 수 있으니, 방문 전 문의해 주세요."
    ]
  ],
  "mapUrl": "https://www.openstreetmap.org/export/embed.html?bbox=126.5018696%2C33.5046567%2C126.5088696%2C33.5096567&amp;layer=mapnik&amp;marker=33.5071567%2C126.5053696",
  "directionsUrl": "https://naver.me/xjYZUjWZ"
};
export const visitHours = () => visitInfo.hours.join('<br>');
export const visitGuidance = () => visitInfo.guidance.map(lines => '<p>' + lines.join('<br>') + '</p>').join('');
export const locationMap = () => `<div class="location-map"><h3>장성카센터 위치</h3><iframe title="장성카센터 위치 지도 — ${visitInfo.address}" src="${visitInfo.mapUrl}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe><p>${visitInfo.address}</p><a class="btn outline" href="${visitInfo.directionsUrl}" target="_blank" rel="noopener noreferrer">네이버 지도에서 보기 <span aria-hidden="true">↗</span></a></div>`;
