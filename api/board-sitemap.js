import { publicQuery, SITE_URL } from '../server/board.js';
import { postUrl, escapeHtml } from '../board-shared.js';
export default async function handler(req, res) {
  try {
    const posts = [];
    for (let offset = 0; ; offset += 1000) {
      const page = await publicQuery('posts', { select: 'category,slug,updated_at', order: 'id.asc' }, `${offset}-${offset + 999}`);
      posts.push(...page); if (page.length < 1000) break;
    }
    const paths = ['/', '/about/', '/services/', '/contact/', '/reviews-faq/', '/blog/', '/blog/summer-check/', '/car-care/', '/repair-cases/', '/news/', '/faq/'];
    const items = paths.map(p => ({ url: SITE_URL + p })).concat(posts.map(p => ({ url: SITE_URL + postUrl(p), date: p.updated_at })));
    res.setHeader('Content-Type', 'application/xml; charset=utf-8'); res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60');
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items.map(p => `<url><loc>${escapeHtml(p.url)}</loc>${p.date ? `<lastmod>${escapeHtml(p.date)}</lastmod>` : ''}</url>`).join('')}</urlset>`);
  } catch { res.setHeader('Cache-Control', 'no-store'); res.status(503).send('Sitemap unavailable'); }
}
