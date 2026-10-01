# 장성카센터 게시판 운영 및 배포 안내

현재 Vite 다중 페이지 프로젝트를 확장했습니다. 예약 서버와 양식, 소개·서비스·고객후기·오시는 길을 보존했습니다. 운영 사이트에만 있었던 로고와 블로그 목록·본문·사진도 같은 주소로 보존했습니다. 운영 홈페이지로의 배포는 아직 수행하지 않았습니다.

## 1. 페이지

| 주소 | 내용 |
|---|---|
| `/car-care/` | 자동차관리 카드 목록 및 검색 |
| `/car-care/:slug/` | 자동차관리 상세 |
| `/repair-cases/` | 정비사례 카드 목록 및 검색 |
| `/repair-cases/:slug/` | 증상 → 점검 → 문제 → 정비 → 안내, 여러 사진 |
| `/news/` | 장성카센터 소식 목록 및 검색 |
| `/news/:slug/` | 소식 상세 |
| `/faq/` | 질문을 클릭하면 펼쳐지는 FAQ |
| `/admin/` | 관리자 로그인, 게시물·FAQ 등록/수정/삭제 |

기존 `/care-guide/`, `/cases/`는 새 게시판 내용과 연결됩니다. 기존 `/care-guide/detail/`, `/cases/detail/`도 삭제하지 않았습니다. 기존 `/reviews-faq/`의 고객후기는 유지하고 FAQ만 같은 DB를 사용합니다. 기존 `/blog/`, `/blog/summer-check/`를 보존했습니다.

메인에는 자동차관리와 정비사례 최신 공개 글을 각각 최대 3개 표시합니다. 샘플은 각 카테고리 2개씩 총 6개와 FAQ 9개입니다. FAQ는 요청한 6개에 기존 질문 3개를 보존했습니다. 정비사례 2개는 실제 고객 사례가 아닌 **구성 예시**로 표시했습니다. 이미지도 설명용 그림입니다. 소식 샘플은 확인하지 않은 운영 일정이나 장비 도입을 주장하지 않습니다.

## 2. 파일

- 기존 수정: `src.js`, `style.css`, `vite.config.js`, `package.json`, `pnpm-lock.yaml`, `.env.example`, `vercel.json`, `robots.txt`, `public/robots.txt`, `sitemap.xml`, `public/sitemap.xml`.
- 기존 HTML 9개에 한국어·UTF-8·viewport 기본 문서 구조 추가: 루트, about, services, cases, cases/detail, care-guide, care-guide/detail, reviews-faq, contact의 `index.html`.
- 게시판: `board-shared.js`, `board-client.js`, `board-admin.js`, `board.css`, car-care/repair-cases/news/faq/admin의 `index.html`.
- 검색용 서버 HTML 및 사이트맵: `server/board.js`, `api/board-page.js`, `api/board-sitemap.js`.
- 기존 블로그 복원: `blog/index.html`, `blog/summer-check/index.html`, `public/images/*.jpg`, `public/jangseong-logo.jpg`.
- 예시 그림: `public/board-images/*.svg`.
- SQL: `supabase/board-schema.sql`, `supabase/board-seed.sql`, `supabase/board-rls-check.sql`.
- 검증: `tests/board.test.js`, `scripts/board-preview.mjs`, `scripts/check-board-preview.mjs`.

작업 전 존재하던 변경사항은 되돌리지 않았습니다. 예약 관련 기존 파일은 수정하지 않았습니다.

## 3. Supabase 적용 결과

프로젝트: `jangseong-board` / `hzcjxqiaklgyxqlovezg`.

- `public.posts`: 요청한 12개 필드. category는 `automotive-care`, `repair-case`, `news`로 제한합니다. `(category, slug)`는 고유하며 슬러그는 영문 소문자·숫자·하이픈입니다. images는 최대 20개, 공개 글에는 published_at이 필요합니다.
- `public.faq`: 요청한 7개 필드. display_order 순으로 표시합니다.
- updated_at은 DB 트리거가 자동으로 갱신합니다.
- Storage `board-images`: 공개 이미지 저장소. 대표 이미지 1개와 추가 이미지 여러 개. 파일당 최대 8MB, JPG·PNG·WebP만 허용합니다.

스키마는 Supabase migration `add_content_boards`로 적용했습니다. `board-schema.sql`은 이미 적용되어 있으므로 같은 프로젝트에 다시 실행하지 마세요. 다른 신규 환경을 구성할 때 사용하는 기록입니다. FAQ seed는 한 번만 실행해야 합니다.

## 4. RLS

| 사용자 | posts / faq | Storage 이미지 |
|---|---|---|
| 방문자 anon | `published = true`인 행 SELECT만 | 공개 이미지 URL 조회만 |
| 일반 로그인 사용자 | 공개 행 SELECT만 | 업로드/수정/삭제 불가 |
| 관리자 | 공개·초안 SELECT, INSERT, UPDATE, DELETE | 업로드/조회/수정/삭제 |

관리자 판정은 **서버에서 설정한 `app_metadata.role = admin`**입니다. 사용자가 수정할 수 있는 user_metadata는 권한 판정에 쓰지 않습니다. UPDATE는 USING과 WITH CHECK를 모두 적용했습니다. anon의 테이블 쓰기 권한도 명시적으로 제거했습니다.

Storage는 공개 버킷이므로 초안에 올린 이미지도 URL을 알면 읽을 수 있습니다. 차량번호·고객 얼굴은 비노출 처리하고, 비공개 자료는 올리지 마세요. 게시물 삭제나 이미지 링크 제거는 저장소 파일을 자동 삭제하지 않습니다. 공유된 사진의 실수 삭제를 피하기 위한 것으로, 사용하지 않는 파일은 Supabase Storage에서 확인 후 정리하세요.

SQL 트랜잭션으로 anon/일반 사용자/관리자의 읽기와 쓰기, 초안 차단, user_metadata로 관리자 권한을 얻을 수 없는지, 이미지 업로드/수정 정책을 확인했습니다. 테스트 데이터는 모두 rollback되어 남지 않았습니다. Storage는 직접 SQL 삭제를 막으므로 파일 삭제 API는 실제 관리자 계정으로 배포 전에 확인해야 합니다. Supabase security advisor는 지적 사항이 없습니다.

## 5. 환경변수

현재 프레임워크는 **Vite**이므로 NEXT_PUBLIC_ 대신 다음 이름을 사용합니다. Vercel에서 Production 및 Preview 환경 모두 설정하고 다시 빌드하세요.

```dotenv
VITE_SUPABASE_URL=https://hzcjxqiaklgyxqlovezg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=Supabase에서_확인한_sb_publishable_키
```

프로젝트 Dashboard → Settings/API Keys에서 **publishable** 키를 사용합니다. frontend와 서버 HTML/사이트맵 함수 모두 이 두 환경변수를 사용하며, 서버도 공개 글 필터와 RLS를 적용받습니다. service_role 또는 secret key는 필요하지 않습니다. 실제 설정은 git에서 제외되는 `.env.local`에 준비했고 `.env.example`에는 변수 이름만 기록했습니다.

기존 예약 환경변수 GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_SHEETS_ID, BOOKING_RETENTION_AUTOMATION_READY를 유지하세요. Vercel의 BOOKING_ALLOWED_ORIGINS는 `https://www.jangseongcar.com,https://jangseong.vercel.app`으로 설정하세요. 예약 설정은 `BOOKING-SETUP.md`를 따릅니다.

## 6. 관리자 계정과 게시물 등록

관리자 `관리자 이메일`은 사용자가 직접 생성했고, 이메일 인증 및 `app_metadata.role = admin` 권한 설정을 확인했습니다. 비밀번호는 사용자가 직접 정했으며 채팅으로 받지 않았습니다. 아래 생성 절차는 추가 관리자 설정에 사용할 수 있습니다.

1. Supabase Dashboard → Authentication → Users에서 사용할 관리자 이메일과 비밀번호로 사용자를 만듭니다. 홈페이지에는 회원가입 기능이 없습니다. 공개 가입도 Authentication 설정에서 비활성화하는 것을 권장합니다.
2. SQL Editor에서 아래 이메일을 **본인의 관리자 이메일**로 바꾸어 실행합니다. 기존 앱 메타데이터는 유지합니다.

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where lower(email) = lower('관리자이메일@example.com');

select id, email, raw_app_meta_data->>'role' as role
from auth.users
where lower(email) = lower('관리자이메일@example.com');
```

3. 사이트 `/admin/`에서 로그인합니다. 역할을 바꾼 뒤에는 로그아웃 후 다시 로그인해 JWT를 갱신합니다.
4. 새 게시물 → 카테고리, 제목, 슬러그, 설명, 본문을 입력합니다. 본문은 일반 텍스트이며 `## 제목`과 빈 줄로 문단을 구분합니다. HTML은 실행되지 않습니다.
5. 정비사례는 ‘정비사례 기본 구성 넣기’를 누르면 요청한 다섯 단계가 입력됩니다. 실제 점검 기록과 비노출 처리한 사진을 사용하세요.
6. 대표 이미지 1개와 추가 이미지 여러 개를 업로드하거나 HTTPS 이미지 URL을 입력합니다. 추가 URL은 한 줄에 하나입니다. 기존 그림 URL은 샘플용입니다.
7. ‘방문자에게 공개’를 체크하고 저장하면 즉시 공개됩니다. 미체크하면 초안으로 저장됩니다. 게시일은 표시용이고 **예약 발행은 지원하지 않습니다**.
8. FAQ 관리에서 질문·답변·표시 순서·공개 여부를 편집합니다. 회원가입·댓글·고객 글쓰기 기능은 없습니다.

슬러그를 바꾸면 이전 글 주소도 바뀝니다. 검색 노출된 글은 가능하면 슬러그를 유지하세요.

## 7. 배포 전 확인

- Vercel의 **기존 장성카센터 프로젝트**에서 환경변수 2개를 추가하고 기존 빌드 `pnpm run build`, 출력 `dist`, vercel.json을 사용합니다. 새 프로젝트로 배포하지 마세요.
- `api/board-page.js`는 빌드된 HTML shell을 함수에 포함합니다. 게시판 목록·상세와 FAQ는 서버 HTML에 본문 및 title/description/Open Graph/canonical을 제공합니다. 공개 여부를 바꾸면 오래된 CDN 글이 남지 않도록 상세 HTML은 no-store입니다.
- 없는 글·비공개 글은 HTTP 404 및 noindex, DB/설정 오류는 503으로 응답합니다.
- 게시물마다 고유한 슬러그 URL을 직접 새로고침해도 열리는지 **Vercel Preview 배포에서** 확인하세요. 로컬에서는 동일 함수의 HTML 출력까지 검증했고 Vercel 라우팅 자체는 Preview 검증이 필요합니다.
- 공개 글과 초안 각각을 등록해 방문자 창에서 확인하고, 관리자 로그인·사진 업로드·수정·삭제를 실제 계정으로 확인합니다. 현재 계정이 없어 로그인 이후 UI 및 실제 파일 업로드는 아직 실행하지 않았습니다.
- 예약 접수는 기존 예약 API를 사용합니다. 로컬 미리보기의 예약은 **테스트 저장소**이며 Google Sheets에 기록하지 않습니다. 운영 환경에서는 기존 예약 환경변수와 보존기간 자동삭제 설정을 확인하고 통제된 테스트 문의로 실제 저장을 확인하세요.
- `/blog/`, `/blog/summer-check/`, 기존 소개·서비스·예약 페이지와 로고·사진을 확인합니다.
- 실제 전화번호·주소·운영시간은 기존처럼 ‘입력 예정’입니다. 운영 전 정확한 정보로 교체하세요. 구성 예시인 정비사례는 실제 자료로 교체하거나 비공개 처리하세요.
- `/sitemap.xml`은 공개 글만 포함하는 동적 사이트맵입니다. Google Search Console과 네이버 서치어드바이저에 등록하세요. 메타태그를 갖추어도 검색 노출은 검색엔진 판단에 따릅니다.

검증 명령:

```bash
pnpm run build
node --test tests/booking.test.js tests/retention.test.js tests/board.test.js
node scripts/board-preview.mjs
# 다른 터미널에서
node scripts/check-board-preview.mjs
```

로컬 미리보기: http://127.0.0.1:4174/ . 공개 게시물은 연결된 Supabase에서 읽습니다. 관리자에서 저장하면 실제 Supabase 데이터가 변경됩니다. 예약 양식만 로컬 테스트 저장소를 사용합니다.

## 완료한 검증

- 최종 `pnpm run build` 성공.
- 게시판·기존 예약·개인정보 보존·운영 Apps Script 호환 테스트 총 22개 통과.
- 실제 Supabase를 읽는 서버 HTML 검사 10개 통과: 목록, 각 분류 상세, FAQ, 보존한 블로그, 예약 페이지, 404, 잘못된 URL, 동적 사이트맵.
- 브라우저에서 PC 3열 / 태블릿 2열 / 모바일 1열, 검색, FAQ 펼침, 상세 사진 2개, 메인 최신 글 각 2개 및 FAQ 4개 로딩 완료 확인.
- 상세 → 기존 예약 양식 → 로컬 접수 성공 확인. Google Sheets에는 테스트 기록을 보내지 않음.
- 관리자 로그인 화면 및 콘솔 오류 없음 확인. 실제 관리자 로그인 후 CRUD·파일 업로드는 계정 등록 후 확인 필요.
- Supabase RLS 실검증 통과, 보안 advisor 지적 사항 없음.
- [완성된 게시판 화면](verification/board-desktop.jpg) 저장.

문서 참고: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase Storage 권한](https://supabase.com/docs/guides/storage/security/access-control), [Vercel 라우팅 설정](https://vercel.com/docs/project-configuration/vercel-json).

## 운영 예약 연결 확인 (2026-10-01)

GitHub `young304671/jangseong`의 배포 원본 `api/booking.js`를 확인했습니다. 운영 환경은 `BOOKING_APPS_SCRIPT_URL`과 `BOOKING_WEBHOOK_SECRET`을 사용합니다. 두 값을 유지하세요. 이 환경에서는 직접 Sheets 인증이나 새 예약 설정 없이 기존 Apps Script 웹훅으로 같은 필드를 전송합니다. 공개 GET 설정과 서명된 접수번호는 새 양식과 연결하고, 웹훅이 `ok: true`를 반환할 때만 성공으로 표시합니다. 실제 고객 문의나 테스트 문의를 운영 시트로 보내지는 않았습니다. 기존 Apps Script 내부의 중복 방지·개인정보 삭제 동작은 원격 구현 확인이 별도로 필요합니다.

Vercel Production에 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_PUBLISHABLE_KEY` 저장 완료. 아직 수정본을 GitHub에 업로드하거나 운영 배포하지 않았습니다.
