import { createClient } from '@supabase/supabase-js';
import { categories, postCards, faqHtml, postUrl, safeImage } from './board-shared.js';
export const supabase = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) : null;
export async function getBoardData(route) {
  if (!supabase) throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  let query = route.faq ? supabase.from('faq').select('*').eq('published', true).order('display_order').order('created_at') : supabase.from('posts').select('*').eq('published', true).eq('category', route.category).order('published_at', { ascending: false }).order('created_at', { ascending: false });
  if (route.slug) query = query.eq('slug', route.slug).maybeSingle();
  const { data, error } = await query;
  if (error) throw error;
  return route.faq ? { faq: data } : route.slug ? { post: data } : { posts: data };
}
export function initSearch(posts) {
  const input = document.querySelector('#board-search');
  input?.addEventListener('input', () => {
    const term = input.value.trim().toLocaleLowerCase();
    const matches = posts.filter(p => `${p.title} ${p.summary} ${p.content}`.toLocaleLowerCase().includes(term));
    document.querySelector('#board-results').innerHTML = matches.length ? postCards(matches) : '<p>검색 결과가 없습니다.</p>';
  });
}
export function updateBoardMeta(route, data) {
  const c = categories[route.category];
  const title = route.admin ? '콘텐츠 관리' : route.faq ? '자주 묻는 질문 FAQ' : route.slug ? (data.post?.title || '게시물을 찾을 수 없습니다') : c.title;
  const description = route.faq ? '장성카센터 방문과 정비에 관한 자주 묻는 질문입니다.' : data.post?.summary || c?.description || '';
  document.title = `${title} | 장성카센터`;
  const set = (attr, key, value) => {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr,key); document.head.append(el); }
    el.content = value;
  };
  set('name','description', description); set('property','og:title',document.title); set('property','og:description',description);
  set('property','og:type', data.post ? 'article' : 'website');
  const url = `https://www.jangseongcar.com${data.post ? postUrl(data.post) : route.faq ? '/faq/' : route.admin ? '/admin/' : `/${c.path}/`}`;
  set('property','og:url',url); set('property','og:site_name','장성카센터'); set('property','og:locale','ko_KR');
  const thumbnail = safeImage(data.post?.thumbnail_url);
  const img = thumbnail && !thumbnail.endsWith('.svg') ? thumbnail : '/jangseong-logo.jpg';
  set('property','og:image', new URL(img, 'https://www.jangseongcar.com').href);
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); } canonical.href = url;
  if (route.admin || (route.slug && !data.post) || data.error) set('name', 'robots', 'noindex,follow');
}
export async function initHomeBoards() {
  for (const [category, id] of [['automotive-care', 'home-care-posts'], ['repair-case', 'home-repair-posts']]) {
    const el = document.getElementById(id);
    if (!el) continue;
    try {
      if (!supabase) throw new Error('unconfigured');
      const { data, error } = await supabase.from('posts').select('*').eq('published', true).eq('category', category).order('published_at', { ascending: false }).limit(3);
      if (error) throw error;
      el.innerHTML = data.length ? postCards(data) : '<p>새로운 이야기를 준비하고 있습니다.</p>';
    } catch { el.innerHTML = `<p>지금은 글을 불러올 수 없습니다. <a href="/${categories[category].path}/">전체 보기 →</a></p>`; }
  }
  const faqElement = document.querySelector('[data-managed-faq]');
  if (faqElement) {
    try {
      if (!supabase) throw new Error('unconfigured');
      const { data, error } = await supabase.from('faq').select('*').eq('published', true).order('display_order').limit(location.pathname.startsWith('/reviews-faq') ? 100 : 4);
      if (error) throw error;
      faqElement.outerHTML = data.length ? faqHtml(data) : '<div class="faq"><p>질문과 답변을 준비하고 있습니다.</p></div>';
    } catch { faqElement.innerHTML = '<p>질문을 불러오지 못했습니다. <a href="/faq/">FAQ 전체 보기 →</a></p>'; }
  }
}
