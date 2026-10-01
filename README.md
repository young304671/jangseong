# 장성카센터 홈페이지

제주 제주시 용담동 장성카센터를 위한 다페이지 반응형 홈페이지입니다.

자동차관리·정비사례·소식 게시판, FAQ 및 관리자 설정은 [BOARD-SETUP.md](BOARD-SETUP.md)를 확인하세요. 기존 블로그와 예약 기능을 유지합니다.

## 로컬 실행

```bash
pnpm install
pnpm run dev
```

## Vercel 배포

1. 이 폴더를 GitHub 저장소에 업로드합니다.
2. Vercel에서 해당 저장소를 불러옵니다.
3. Framework Preset은 `Vite`를 선택합니다.
4. Build Command는 `pnpm run build`, Output Directory는 `dist`를 사용합니다.

`vercel.json`에 필요한 설정이 포함되어 있어 일반적으로 별도 변경 없이 배포할 수 있습니다.

## 공개 전 교체할 정보

- 실제 전화번호와 정확한 도로명 주소
- 운영시간, 점심시간과 휴무일
- 실제 매장·상담·정비·대표 및 직원 사진
- 실제 고객후기와 정비 사례
- `src.js`, `robots.txt`, `sitemap.xml`에 들어 있는 예시 도메인

확인되지 않은 정보는 사이트에서 모두 `입력 예정`으로 표시되어 있습니다.
