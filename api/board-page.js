import { readFile } from 'node:fs/promises';
import { boardRoute, renderBoard } from '../board-shared.js';
import { serverBoardData, boardMetadata } from '../server/board.js';
export default async function handler(req, res) {
  const requestUrl = new URL(req.url, 'https://www.jangseongcar.com');
  const route = boardRoute(requestUrl.searchParams.get('path') || requestUrl.pathname);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  if (!route || route.admin || route.invalid) return res.status(404).send('<h1>페이지를 찾을 수 없습니다</h1><a href="/car-care/">자동차관리</a>');
  let data;
  let status = 200;
  try { data = await serverBoardData(route); if (route.slug && !data.post) status = 404; }
  catch { data = { error: true }; status = 503; res.setHeader('Retry-After', '60'); }
  try {
    const template = await readFile(new URL('../dist/car-care/index.html', import.meta.url), 'utf8');
    const html = template.replace(/<title>[\s\S]*?<\/title>/, boardMetadata(route, data))
      .replace('<div id="app"></div>', `<div id="app">${renderBoard(route, data)}</div><script>window.__BOARD_DATA__=${JSON.stringify(data).replace(/</g, '\\u003c')};</script>`);
    return res.status(status).send(html);
  } catch { return res.status(503).send('<html lang="ko"><meta charset="utf-8"><meta name="robots" content="noindex"><h1>페이지를 준비하고 있습니다</h1><a href="/contact/#booking">예약·문의하기</a></html>'); }
}
