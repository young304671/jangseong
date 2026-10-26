import './blog-categories.css';

// Blog posts remain in blog/index.html. Assign each .blog-card a category ID
// with data-blog-category when adding a post; parent counts include children.
export const blogCategories = [
  { id: 'all', label: '전체보기' },
  { id: 'notice', label: '공지사항' },
  { id: 'repair', label: '차량정비', children: [
    ['engine-oil', '엔진오일'], ['transmission-oil', '밋션오일'],
    ['brake', '브레이크'], ['noise', '자동차소음'], ['lpg-lpi', 'LPG/LPI차량'],
    ['engine', '엔진'], ['electrical', '전장관리'],
  ] },
  { id: 'care', label: '자동차관리', children: [
    ['aircon', '에어컨'], ['battery', '배터리'], ['tire', '타이어'],
    ['seasonal-check', '계절점검'], ['care-tips', '자동차관리 상식'],
  ] },
  { id: 'emissions', label: '검사불합격/배출가스' },
];

export function initBlogCategories() {
  const list = document.querySelector('.blog-list');
  if (!list) return;
  const cards = [...list.querySelectorAll('.blog-card')];
  const layout = document.createElement('div');
  layout.className = 'wrap blog-layout';
  list.before(layout);
  list.classList.remove('wrap');
  const sidebar = document.createElement('aside');
  sidebar.className = 'blog-categories';
  sidebar.innerHTML = `<button class="blog-category-toggle" type="button" aria-expanded="false" aria-controls="blog-category-nav">카테고리 <span>전체보기</span><b aria-hidden="true">⌄</b></button><h2>카테고리</h2><nav id="blog-category-nav" aria-label="블로그 카테고리"><ul></ul></nav>`;
  layout.append(sidebar, list);
  const matches = (card, id) => {
    const group = blogCategories.find(category => category.id === id);
    return id === 'all' || card.dataset.blogCategory === id ||
      !!group?.children?.some(([child]) => child === card.dataset.blogCategory);
  };
  const menu = sidebar.querySelector('ul');
  const item = (id, label) => `<button type="button" data-category="${id}" aria-pressed="${id === 'all'}"><span>${label}</span><small>${cards.filter(card => matches(card, id)).length}</small></button>`;
  menu.innerHTML = blogCategories.map(category => `<li>${item(category.id, category.label)}${category.children ? `<ul>${category.children.map(([id, label]) => `<li>${item(id, label)}</li>`).join('')}</ul>` : ''}</li>`).join('');
  const status = document.createElement('p');
  status.className = 'blog-filter-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  list.prepend(status);
  const empty = document.createElement('p');
  empty.className = 'blog-empty';
  empty.textContent = '등록된 글이 없습니다.';
  empty.hidden = true;
  list.append(empty);
  const toggle = sidebar.querySelector('.blog-category-toggle');
  toggle.addEventListener('click', () => toggle.setAttribute('aria-expanded', String(toggle.getAttribute('aria-expanded') !== 'true')));
  function select(id, label) {
    let count = 0;
    cards.forEach(card => { card.hidden = !matches(card, id); if (!card.hidden) count++; });
    menu.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === id)));
    status.textContent = `${label} · ${count}개의 글`;
    empty.hidden = count !== 0;
    toggle.querySelector('span').textContent = label;
  }
  menu.addEventListener('click', event => {
    const button = event.target.closest('button[data-category]');
    if (button) select(button.dataset.category, button.querySelector('span').textContent);
  });
  select('all', '전체보기');
}
