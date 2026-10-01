export const categories = {
  'automotive-care': { path: 'car-care', title: '자동차관리', description: '운전자라면 알아두면 좋은 자동차 관리 이야기' },
  'repair-case': { path: 'repair-cases', title: '정비사례', description: '실제 점검과 정비 과정을 소개합니다' },
  news: { path: 'news', title: '장성카센터 소식', description: '장성카센터의 새로운 소식과 운영 안내' },
};
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function safeImage(value) {
  try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch { return /^\/board-images\/[a-z0-9-]+\.svg$/.test(value || '') ? value : ''; }
}
export function boardRoute(path) {
  const parts = path.replace(/\/index\.html$/, '/').split('/').filter(Boolean);
  const category = Object.keys(categories).find(k => categories[k].path === parts[0]);
  return category ? { category, slug: parts[1] || '', invalid: parts.length > 2 } : parts[0] === 'faq' ? { faq: true, invalid: parts.length > 1 } : parts[0] === 'admin' ? { admin: true } : null;
}
export const postUrl = p => `/${categories[p.category].path}/${encodeURIComponent(p.slug)}/`;
export const dateLabel = value => value ? new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value)) : '';
export function boardTabs(active) {
  return `<nav class="board-tabs" aria-label="자동차관리 콘텐츠">${Object.entries(categories).map(([k, c]) => `<a href="/${c.path}/" ${k === active ? 'aria-current="page"' : ''}>${c.title}</a>`).join('')}<a href="/faq/" ${active === 'faq' ? 'aria-current="page"' : ''}>FAQ</a></nav>`;
}
export function postCards(posts) {
  return `<div class="board-grid">${posts.map(p => `<article class="board-card"><a href="${postUrl(p)}"><img src="${escapeHtml(safeImage(p.thumbnail_url) || '/board-images/care.svg')}" alt="${escapeHtml(p.title)}" loading="lazy" width="640" height="400"><div class="board-card-body"><p class="eyebrow">${categories[p.category].title}</p><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.summary)}</p><time datetime="${escapeHtml(p.published_at || p.created_at)}">${dateLabel(p.published_at || p.created_at)}</time><span class="board-more">자세히 보기 →</span></div></a></article>`).join('')}</div>`;
}
export function contentHtml(content) {
  // Plain text with Markdown headings; raw HTML is never interpreted.
  return String(content || '').split(/\n\s*\n/).map(block => {
    const heading = block.match(/^#{1,3} ([^\n]+)\n?([\s\S]*)$/);
    return heading ? `<h2>${escapeHtml(heading[1])}</h2>${heading[2] ? `<p>${escapeHtml(heading[2]).replace(/\n/g, '<br>')}</p>` : ''}` : `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`;
  }).join('');
}
export function faqHtml(items) {
  return `<div class="faq board-faq">${items.map(p => `<details><summary>${escapeHtml(p.question)}<span aria-hidden="true">＋</span></summary><p>${escapeHtml(p.answer).replace(/\n/g, '<br>')}</p></details>`).join('')}</div>`;
}
export function renderBoard(route, data = {}) {
  if (data.error) return `<main id="main"><section><div class="wrap"><h1>콘텐츠를 불러오지 못했습니다</h1><p>잠시 후 다시 시도해 주세요.</p><a class="btn outline" href="${route.faq ? '/faq/' : `/${categories[route.category].path}/`}">다시 불러오기</a></div></section></main>`;
  if (route.faq) return `<main id="main"><section class="page-hero"><div class="wrap"><p class="eyebrow">FAQ</p><h1>자주 묻는 질문</h1><p>방문과 정비에 관한 궁금증을 확인하세요.</p></div></section><section><div class="wrap">${boardTabs('faq')}${data.faq?.length ? faqHtml(data.faq) : '<p>질문과 답변을 준비하고 있습니다.</p>'}<div class="board-cta"><h2>더 궁금한 점이 있으신가요?</h2><a class="btn primary" href="/contact/#booking">예약·문의하기 →</a></div></div></section></main>`;
  const c = categories[route.category];
  if (route.slug) {
    const p = data.post;
    if (!p || route.invalid) return `<main id="main"><section><div class="wrap"><h1>게시물을 찾을 수 없습니다</h1><p>삭제되었거나 공개되지 않은 글입니다.</p><a class="btn outline" href="/${c.path}/">${c.title} 목록으로 →</a></div></section></main>`;
    return `<main id="main"><article class="wrap board-detail">${boardTabs(route.category)}<p class="eyebrow">${c.title}</p><h1>${escapeHtml(p.title)}</h1><time datetime="${escapeHtml(p.published_at || p.created_at)}">${dateLabel(p.published_at || p.created_at)}</time><p class="board-summary">${escapeHtml(p.summary)}</p><img class="board-cover" src="${escapeHtml(safeImage(p.thumbnail_url) || '/board-images/care.svg')}" alt="${escapeHtml(p.title)}" width="1000" height="625">${route.category === 'repair-case' ? '<blockquote>고객 이야기를 먼저 듣고 점검 후 필요한 정비만 안내합니다.</blockquote>' : ''}<div class="board-content">${contentHtml(p.content)}</div><div class="board-gallery">${(p.images || []).filter(safeImage).map((url, i) => `<img src="${escapeHtml(safeImage(url))}" alt="${escapeHtml(p.title)} 추가 사진 ${i + 1}" loading="lazy">`).join('')}</div><div class="board-cta"><h2>내 차량도 점검이 필요하신가요?</h2><a class="btn primary" href="/contact/#booking">예약·문의하기 →</a></div><a class="board-back" href="/${c.path}/">← ${c.title} 전체 보기</a></article></main>`;
  }
  return `<main id="main"><section class="page-hero"><div class="wrap"><p class="eyebrow">JANGSEONG STORIES</p><h1>${c.title}</h1><p>${c.description}</p></div></section><section><div class="wrap">${boardTabs(route.category)}${route.category === 'repair-case' ? '<p class="board-principle">고객 이야기를 먼저 듣고 점검 후 필요한 정비만 안내합니다.</p>' : ''}<label class="board-search">글 검색<input type="search" id="board-search" placeholder="제목이나 내용으로 검색" maxlength="100"></label><div id="board-results" aria-live="polite">${data.posts?.length ? postCards(data.posts) : '<p>등록된 게시물이 없습니다. 새로운 이야기를 준비하고 있습니다.</p>'}</div></div></section></main>`;
}
