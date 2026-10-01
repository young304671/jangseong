import { categories, escapeHtml, safeImage, postUrl } from '../board-shared.js';
export const SITE_URL = 'https://www.jangseongcar.com';
export async function publicQuery(table, params, range) {
  const base = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !key) throw new Error('Board environment is not configured');
  const url = new URL(`/rest/v1/${table}`, base);
  url.search = new URLSearchParams({ select: '*', published: 'eq.true', ...params }).toString();
  const response = await fetch(url, { headers: { apikey: key, ...(range ? { Range: range } : {}) }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Board query failed (${response.status})`);
  return response.json();
}
export async function serverBoardData(route) {
  if (route.faq) return { faq: await publicQuery('faq', { order: 'display_order.asc,created_at.asc' }) };
  const params = { category: `eq.${route.category}`, order: 'published_at.desc,created_at.desc' };
  if (route.slug) params.slug = `eq.${route.slug}`;
  const posts = await publicQuery('posts', params);
  return route.slug ? { post: posts[0] || null } : { posts };
}
export function boardMetadata(route, data) {
  const c = categories[route.category];
  const post = data.post;
  const title = `${route.faq ? '자주 묻는 질문 FAQ' : route.slug ? post?.title || '게시물을 찾을 수 없습니다' : c?.title || '장성카센터'} | 장성카센터`;
  const description = post?.summary || c?.description || '장성카센터 방문과 정비에 관한 자주 묻는 질문입니다.';
  const url = `${SITE_URL}${post ? postUrl(post) : route.faq ? '/faq/' : `/${c.path}/`}`;
  const thumbnail = safeImage(post?.thumbnail_url);
  const image = new URL(thumbnail && !thumbnail.endsWith('.svg') ? thumbnail : '/jangseong-logo.jpg', SITE_URL).href;
  const article = post ? { '@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: post.summary, datePublished: post.published_at, dateModified: post.updated_at, image: [image], mainEntityOfPage: url, author: { '@type': 'Organization', name: '장성카센터' } } : null;
  const structured = route.faq ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: (data.faq || []).map(p => ({ '@type': 'Question', name: p.question, acceptedAnswer: { '@type': 'Answer', text: p.answer } })) } : article;
  return `<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:type" content="${post ? 'article' : 'website'}"><meta property="og:url" content="${escapeHtml(url)}"><meta property="og:image" content="${escapeHtml(image)}"><meta property="og:site_name" content="장성카센터"><meta property="og:locale" content="ko_KR"><link rel="canonical" href="${escapeHtml(url)}">${data.error || (route.slug && !post) ? '<meta name="robots" content="noindex,follow">' : ''}${structured ? `<script type="application/ld+json">${JSON.stringify(structured).replace(/</g, '\\u003c')}</script>` : ''}`;
}
