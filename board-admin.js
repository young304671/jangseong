import { supabase } from './board-client.js';
import { categories, escapeHtml as esc, safeImage } from './board-shared.js';

const repairTemplate = '## 고객 증상\n\n## 점검 내용\n\n## 발견된 문제\n\n## 정비 내용\n\n## 정비 후 안내';
const field = (label, name, value = '', extra = '') => `<label>${label}<input name="${name}" value="${esc(value)}" ${extra}></label>`;
export const adminShell = () => '<main id="main"><div class="wrap admin-wrap"><h1>콘텐츠 관리</h1><div id="admin-root"><p role="status">관리자 권한을 확인하고 있습니다.</p></div></div></main>';

export async function initAdmin() {
  const root = document.getElementById('admin-root');
  if (!supabase) { root.innerHTML = '<p>Supabase 환경변수가 설정되지 않았습니다. BOARD-SETUP.md의 설정을 확인하세요.</p>'; return; }
  let mode = 'posts';
  let rows = [];
  let busy = false;
  function message(text) { const el = document.getElementById('admin-msg'); if (el) { el.textContent = text; el.hidden = !text; } }
  function login(text = '') {
    root.innerHTML = `<p>등록된 관리자 계정으로 로그인하세요.</p><form class="admin-login" id="admin-login">${field('이메일', 'email', '', 'type="email" autocomplete="username" required')}${field('비밀번호', 'password', '', 'type="password" autocomplete="current-password" required')}<button class="btn primary">로그인</button></form><p id="admin-msg" class="admin-msg" role="status" ${text ? '' : 'hidden'}>${esc(text)}</p>`;
    document.getElementById('admin-login').onsubmit = async e => {
      e.preventDefault(); const form = e.currentTarget; const button = form.querySelector('button'); button.disabled = true; message('로그인 중입니다.');
      try {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email.value.trim(), password: form.password.value });
        form.password.value = '';
        if (error) throw error;
        await checkUser();
      } catch { message('로그인하지 못했습니다. 이메일과 비밀번호를 확인해 주세요.'); button.disabled = false; }
    };
  }
  async function checkUser() {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return login();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) { await supabase.auth.signOut(); return login('다시 로그인해 주세요.'); }
    if (user.app_metadata?.role !== 'admin') { await supabase.auth.signOut(); return login('이 계정에는 관리자 권한이 없습니다.'); }
    await dashboard();
  }
  async function dashboard() {
    root.innerHTML = `<div class="admin-actions"><button class="btn ${mode === 'posts' ? 'primary' : 'outline'}" id="admin-posts">게시물 관리</button><button class="btn ${mode === 'faq' ? 'primary' : 'outline'}" id="admin-faq">FAQ 관리</button><button class="btn outline" id="admin-logout">로그아웃</button></div><p class="admin-note">글과 이미지는 관리자만 등록할 수 있습니다. 이미지에는 차량번호와 고객 얼굴이 보이지 않도록 처리해 주세요. 공개 이미지 저장소이므로 비공개 개인정보는 업로드하지 마세요.</p><button class="btn primary" id="admin-new">${mode === 'posts' ? '새 게시물' : '새 FAQ'} 작성</button><p id="admin-msg" class="admin-msg" role="status" hidden></p><div class="admin-editor" id="admin-editor" hidden></div><div id="admin-list" aria-live="polite">목록을 불러오고 있습니다.</div>`;
    document.getElementById('admin-posts').onclick = () => { if (!busy) { mode = 'posts'; dashboard(); } };
    document.getElementById('admin-faq').onclick = () => { if (!busy) { mode = 'faq'; dashboard(); } };
    document.getElementById('admin-logout').onclick = async () => { if (!busy) { const { error } = await supabase.auth.signOut(); if (error) return message('로그아웃하지 못했습니다. 다시 시도해 주세요.'); login(); } };
    document.getElementById('admin-new').onclick = () => { if (!busy) edit(); };
    await list();
  }
  async function list() {
    const { data, error } = await supabase.from(mode).select('*').order(mode === 'posts' ? 'created_at' : 'display_order', { ascending: mode === 'faq' });
    if (error) { document.getElementById('admin-list').innerHTML = '<p>목록을 불러오지 못했습니다.</p><button id="admin-retry" class="btn outline">다시 시도</button>'; document.getElementById('admin-retry').onclick = list; return; }
    rows = data;
    const el = document.getElementById('admin-list');
    el.innerHTML = rows.length ? rows.map(p => `<div class="admin-row"><div><strong>${esc(p.title || p.question)}</strong><p>${p.published ? '공개' : '비공개 초안'}${p.category ? ` · ${categories[p.category].title}` : ` · 표시 순서 ${p.display_order}`}</p></div><div><button data-edit="${p.id}">수정</button> <button data-delete="${p.id}">삭제</button></div></div>`).join('') : '<p>등록된 콘텐츠가 없습니다.</p>';
    el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => { if (!busy) edit(rows.find(p => p.id === b.dataset.edit)); });
    el.querySelectorAll('[data-delete]').forEach(b => b.onclick = async () => {
      if (busy || !confirm('이 콘텐츠를 삭제하시겠습니까? 삭제한 글은 복구할 수 없습니다.')) return;
      busy = true; b.disabled = true;
      try {
        const { data: removed, error } = await supabase.from(mode).delete().eq('id', b.dataset.delete).select('id');
        if (error || !removed?.length) throw new Error();
        document.getElementById('admin-editor').hidden = true; message('삭제했습니다.'); await list();
      } catch { message('삭제하지 못했습니다. 관리자 권한과 연결 상태를 확인하세요.'); b.disabled = false; }
      finally { busy = false; }
    });
  }
  function edit(p = {}) {
    const editor = document.getElementById('admin-editor'); editor.hidden = false;
    const postFields = `${field('제목', 'title', p.title, 'required maxlength="200"')}${field('URL 슬러그 (영문 소문자·숫자·하이픈)', 'slug', p.slug, 'required maxlength="120" pattern="[a-z0-9]+(-[a-z0-9]+)*"')}<label>카테고리<select name="category">${Object.entries(categories).map(([k,c]) => `<option value="${k}" ${p.category === k ? 'selected' : ''}>${c.title}</option>`).join('')}</select></label><label>짧은 설명<textarea name="summary" maxlength="500" required>${esc(p.summary)}</textarea></label><label>본문<textarea name="content" maxlength="100000" required>${esc(p.content)}</textarea></label><p class="admin-note">제목은 “## 제목”으로, 문단 사이는 빈 줄로 구분합니다. HTML은 표시하지 않습니다.</p><button type="button" class="btn outline" id="repair-template">정비사례 기본 구성 넣기</button>${field('대표 이미지 URL (또는 아래에서 업로드)', 'thumbnail_url', p.thumbnail_url, 'maxlength="2000"')}<label>대표 이미지 업로드<input name="thumbnail_file" type="file" accept="image/jpeg,image/png,image/webp"></label><label>추가 이미지 URL (한 줄에 하나, 최대 20장)<textarea name="images">${esc((p.images || []).join('\n'))}</textarea></label><label>추가 이미지 업로드 (여러 장 선택 가능)<input name="image_files" type="file" multiple accept="image/jpeg,image/png,image/webp"></label><p class="admin-note">이미지당 최대 8MB, JPG·PNG·WebP 형식. 사진은 Supabase Storage에 저장됩니다.</p><div id="admin-images" class="admin-images"></div><label>게시일<input name="published_at" type="datetime-local" value="${p.published_at ? toLocal(p.published_at) : ''}"></label><p class="admin-note">게시일은 표시용입니다. 예약 발행 기능은 없으며 공개를 선택하면 즉시 노출됩니다. 슬러그 변경 시 이전 주소가 바뀝니다.</p>`;
    const faqFields = `${field('질문', 'question', p.question, 'required maxlength="300"')}<label>답변<textarea name="answer" required maxlength="5000">${esc(p.answer)}</textarea></label>${field('표시 순서 (작은 숫자부터)', 'display_order', p.display_order ?? 0, 'type="number" step="1" required')}`;
    editor.innerHTML = `<form id="admin-form"><h2>${p.id ? '콘텐츠 수정' : '새 콘텐츠'}</h2>${mode === 'posts' ? postFields : faqFields}<label class="agree"><input type="checkbox" name="published" ${p.published ? 'checked' : ''}>방문자에게 공개</label><div class="admin-actions"><button class="btn primary" type="submit">저장</button><button class="btn outline" type="button" id="admin-cancel">취소</button></div></form>`;
    const form = document.getElementById('admin-form');
    document.getElementById('admin-cancel').onclick = () => { if (!busy) editor.hidden = true; };
    if (mode === 'posts') {
      document.getElementById('repair-template').onclick = () => { if (!form.content.value.trim() || confirm('현재 본문을 정비사례 기본 구성으로 바꾸시겠습니까?')) { form.content.value = repairTemplate; form.category.value = 'repair-case'; } };
      const previews = () => { document.getElementById('admin-images').innerHTML = [form.thumbnail_url.value, ...form.images.value.split('\n')].filter(safeImage).map((u,i) => `<img src="${esc(safeImage(u))}" alt="이미지 미리보기 ${i + 1}">`).join(''); };
      form.thumbnail_url.oninput = previews; form.images.oninput = previews; previews();
    }
    form.onsubmit = async e => {
      e.preventDefault(); if (busy) return; busy = true; const table = mode;
      form.querySelectorAll('button').forEach(b => b.disabled = true); message('저장 중입니다.');
      try {
        const published = form.published.checked;
        let values;
        if (table === 'posts') {
          const extra = form.images.value.split('\n').map(s => s.trim()).filter(Boolean);
          const files = [...form.image_files.files];
          if (extra.length + files.length > 20) throw new Error('추가 이미지는 최대 20장입니다.');
          const coverFile = form.thumbnail_file.files[0];
          [...files, ...(coverFile ? [coverFile] : [])].forEach(validateFile);
          if (form.thumbnail_url.value && !safeImage(form.thumbnail_url.value.trim())) throw new Error('대표 이미지 URL은 https 주소를 입력하세요.');
          if (extra.some(u => !safeImage(u))) throw new Error('추가 이미지 URL은 https 주소를 입력하세요.');
          // Keep uploaded URLs in the form if a database write fails; retry does not re-upload.
          if (coverFile) { form.thumbnail_url.value = await upload(coverFile); form.thumbnail_file.value = ''; }
          for (const file of files) { extra.push(await upload(file)); form.images.value = extra.join('\n'); }
          form.image_files.value = '';
          values = { title: form.elements.namedItem('title').value.trim(), slug: form.slug.value.trim(), category: form.category.value, summary: form.summary.value.trim(), content: form.content.value.trim(), thumbnail_url: form.thumbnail_url.value.trim() || null, images: extra, published, published_at: form.published_at.value ? new Date(form.published_at.value).toISOString() : published ? new Date().toISOString() : null };
        } else { values = { question: form.question.value.trim(), answer: form.answer.value.trim(), display_order: Number(form.display_order.value), published }; }
        const query = p.id ? supabase.from(table).update(values).eq('id', p.id) : supabase.from(table).insert(values);
        const { data, error } = await query.select('id');
        if (error) { if (error.code === '23505') throw new Error('이 카테고리에 같은 슬러그가 있습니다. 다른 슬러그를 입력하세요.'); throw new Error('저장하지 못했습니다. 필수 항목과 관리자 권한, 연결 상태를 확인하세요.'); }
        if (!data?.length) throw new Error('저장되지 않았습니다. 관리자 권한을 확인하고 다시 로그인하세요.');
        editor.hidden = true; message('저장했습니다. 공개 글은 게시판에서 바로 확인할 수 있습니다.'); await list();
      } catch (error) { message(error.message || '저장하지 못했습니다. 다시 시도해 주세요.'); }
      finally { busy = false; form.querySelectorAll('button').forEach(b => b.disabled = false); }
    };
    editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function validateFile(file) { if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('JPG·PNG·WebP 이미지만 업로드할 수 있습니다.'); if (file.size > 8 * 1024 * 1024) throw new Error('이미지 크기는 8MB 이하여야 합니다.'); }
  async function upload(file) {
    validateFile(file);
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
    const name = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('board-images').upload(name, file, { contentType: file.type, upsert: false });
    if (error) throw new Error('이미지를 업로드하지 못했습니다. 관리자 권한과 Storage 설정을 확인하세요.');
    return supabase.storage.from('board-images').getPublicUrl(name).data.publicUrl;
  }
  function toLocal(iso) { const date = new Date(iso); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,16); }
  await checkUser();
}
