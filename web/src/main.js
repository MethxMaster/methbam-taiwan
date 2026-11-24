import './style.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import D from './trip.json';
import { TODO } from './todo.js';
import { DAY_INFO, COST_DAYS, LOCS, HOTELS, HOTEL_FOR_DAY } from './days.js';
import { TRANSPORT, PACKS, WHEN, STATUS, LINKS } from './transport.js';
import { FOODS, FZONES, FTYPES } from './foods.js';
import { HOTEL_LIST, HZONES, HTYPES } from './hotels.js';
import { $, $$, esc, store, thb, fmtH, enc, gmSearch, gmDir, seg, blk, tile } from './util.js';
import { pinIcon, baseTiles, addFullscreen, DAYC, dayColor, addLeg, spreadPins } from './maplib.js';
import { nowTW, todayInfo, stepNow } from './today.js';
import { shareState, readShared } from './sync.js';

/* ---------- helpers ---------- */
const img = p => (p.img ? import.meta.env.BASE_URL + p.img : null);
const P = D.places, DAYS = D.days, LEGS = D.legs;
const byCode = Object.fromEntries(P.map(p => [p.code, p]));
const AIRPORT = { lat: 25.0777, lng: 121.2328 };
const ORDER = { D1: [], D2: ['E2', 'E1', 'F1'], D3: ['F2', 'B1'], D4: ['C2', 'D1', 'C1'], D5: ['A2', 'A1'] };
const GROUP_SHORT = { A: 'ไทเป', B: 'อูไหล', C: 'จีหลง', D: 'จิ่วเฟิ่น', E: 'อาลีซาน', F: 'SML', G: 'ทางผ่าน' };
const gk = p => p.code.replace(/\d+/g, '');
// หมวดหมู่สถานที่ (จัดกลุ่มจากแท็กเดิมของแต่ละที่)
const CATS = [
  ['nature', 'ธรรมชาติ & วิว', ['ธรรมชาติ', 'วิว', 'เดินป่า', 'ภูเขา', 'ทะเล', 'ทะเลสาบ', 'ทะเลหมอก']],
  ['city', 'ในเมือง', ['เมือง', 'ช้อปปิ้ง', 'ศิลปะ/ครีเอทีฟ', 'ศิลปะ', 'สถาปัตยกรรม']],
  ['landmark', 'แลนด์มาร์ก', ['แลนด์มาร์ก']],
  ['temple', 'วัด & ประวัติศาสตร์', ['วัด', 'ประวัติศาสตร์', 'พิพิธภัณฑ์', 'วัฒนธรรม']],
  ['old', 'ย่านเก่า', ['ย่านเก่า']],
  ['food', 'ตลาด & อาหาร', ['ตลาดกลางคืน', 'อาหาร']],
  ['onsen', 'น้ำพุร้อน', ['น้ำพุร้อน']],
  ['photo', 'ถ่ายรูป', ['ถ่ายรูป']],
  ['family', 'ครอบครัว & กิจกรรม', ['ครอบครัว', 'ออกกำลัง', 'ตามฤดู']],
];
const tagsOf = p => p.tags.split(',').map(s => s.trim()).filter(Boolean);
const inCat = (p, c) => tagsOf(p).some(x => c[2].includes(x));
const dayDate = d => new Date(d.date + 'T00:00:00');
const dayLabel = d => `${d.wd} ${dayDate(d).getDate()} ธ.ค.`;
const WD = { 'พุธ': 'พุธ', 'พฤหัสบดี': 'พฤ.', 'ศุกร์': 'ศุกร์', 'เสาร์': 'เสาร์', 'อาทิตย์': 'อา.' };
function resolveLoc(c) {
  if (!c) return null;
  if (byCode[c]) { const p = byCode[c]; return { key: c, name: p.name, lat: p.lat, lng: p.lng, q: p.search + ' Taiwan' }; }
  return LOCS[c] ? { key: c, ...LOCS[c] } : null;
}

/* ---------- countdown ---------- */
const TRIP_START = new Date('2026-12-16T00:00:00+08:00');
const TRIP_END = new Date('2026-12-21T00:00:00+08:00');
(() => {
  const now = nowTW(), el = $('#countdown');
  el.textContent = now < TRIP_START ? `อีก ${Math.ceil((TRIP_START - now) / 864e5)} วัน` : now < TRIP_END ? `วันที่ ${Math.floor((now - TRIP_START) / 864e5) + 1} ของทริป` : 'จบทริปแล้ว';
})();

/* ---------- state / routing ---------- */
const TABS = ['plan', 'map', 'places', 'food', 'hotels', 'transport', 'cost', 'todo'];
let state = { tab: 'plan', day: 'all', anchor: null, focus: null };
const TODAY = todayInfo(DAYS);
if (TODAY) state.day = TODAY.day;
function parseHash() {
  const [t, d] = (location.hash || '').slice(1).split('/');
  if (TABS.includes(t)) state.tab = t;
  if (t === 'plan') state.day = DAYS.some(x => x.day === d) ? d : 'all';
  if (t === 'transport') state.anchor = d || null;
}
function go(tab, day, anchor) {
  state.tab = tab; if (day) state.day = day;
  if (anchor) state.anchor = anchor;
  history.replaceState(null, '', `#${tab}${tab === 'plan' && state.day !== 'all' ? '/' + state.day : ''}${tab === 'transport' && state.anchor ? '/' + state.anchor : ''}`);
  show();
}
function show() {
  document.body.classList.remove('no-scroll'); $$('.mapfs').forEach(e => e.classList.remove('mapfs'));
  $$('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === state.tab));
  TABS.forEach(t => $('#tab-' + t).classList.toggle('on', t === state.tab));
  if (state.tab === 'plan') renderPlan();
  if (TMITEMS[state.tab]) setTimeout(() => refreshTabMap(state.tab, true), 40);
  if (state.tab === 'map') { initMap(); setTimeout(() => { map.invalidateSize(); drawMap(); }, 30); }
  const target = state.tab === 'transport' && state.anchor ? document.getElementById('tr-' + state.anchor)
    : state.tab === 'places' && state.focus ? document.querySelector(`#tab-places .ph[data-pick="${state.focus}"]`) : null;
  if (target) { window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 340 }); if (state.focus) { target.classList.add('flash'); const fk = state.focus; setTimeout(() => pickItem('places', fk, 'card'), 150); } }
  else window.scrollTo({ top: 0 });
  state.anchor = null; state.focus = null;
}
$$('.tabs button').forEach(b => b.onclick = () => go(b.dataset.tab));

/* ---------- place sheet ---------- */
function openPlace(code) {
  const p = byCode[code]; if (!p) return;
  const src = img(p);
  $('#sheetBox').innerHTML = `<button class="sheet-x" data-close aria-label="ปิด">✕</button>
    ${src ? `<img src="${esc(src)}" alt="${esc(p.name)}">` : '<div class="noimg">ยังไม่มีรูป</div>'}
    <div class="sb">
      <div class="small">${esc(p.code)} · ${esc(GROUP_SHORT[gk(p)])}${p.day ? ' · ' + esc(p.day) : ' · ยังไม่วางในแผน'}</div>
      <h3>${esc(p.name)}</h3>
      <dl class="kv" style="margin-top:14px">
        <dt>เวลาเที่ยว</dt><dd>${esc(p.hours)} ชม.</dd>
        <dt>ช่วงที่ดี</dt><dd>${esc(p.best)}</dd>
        ${p.drive ? `<dt>ห่างจุดหลัก</dt><dd>~${esc(p.drive)} นาที</dd>` : ''}
        <dt>ประเภท</dt><dd>${tagsOf(p).map(x => `<span class="chip">${esc(x)}</span>`).join('')}</dd>
        <dt>ความน่าไป</dt><dd>${esc(p.rec)}</dd>
        <dt>หมายเหตุ</dt><dd>${esc(p.note)}</dd>
      </dl>
      <div class="links"><button class="more" data-showplace="${p.code}" style="font-size:17px">ดูในแท็บสถานที่</button><a href="${gmSearch(p.search + ' Taiwan')}" target="_blank" rel="noopener">เปิดใน Google Maps</a>${p.imgFile ? `<a href="https://commons.wikimedia.org/wiki/File:${enc(p.imgFile)}" target="_blank" rel="noopener">เครดิตรูป</a>` : ''}</div>
    </div>`;
  $('#sheet').hidden = false;
}
$('#sheet').addEventListener('click', e => { if (e.target.closest('[data-close]')) $('#sheet').hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#sheet').hidden = true; });
document.addEventListener('click', e => {
  const ht = e.target.closest('[data-hotels]');
  if (ht) { const v = ht.dataset.hotels, zm = { ali: 'อาลีซาน', sml: 'SML', tpe: 'ไทเป' }; Object.assign(HF, { q: '', z: zm[v] || 'all', s: v === 'plan' ? 'plan' : 'all', c: 'all', o: 'default' }); renderHotels(); go('hotels'); return; }
  const fd = e.target.closest('[data-foods]');
  if (fd) { const v = fd.dataset.foods; Object.assign(FF, { q: '', z: 'all', d: v === 'plan' ? 'all' : v, s: 'plan', c: 'all' }); renderFood(); go('food'); return; }
  const tr = e.target.closest('[data-tr]');
  if (tr) { $('#sheet').hidden = true; go('transport', null, tr.dataset.tr); return; }
  const pl = e.target.closest('[data-places]');
  if (pl) { const v = pl.dataset.places; Object.assign(F, { q: '', g: 'all', d: v === 'plan' ? 'all' : v, s: 'plan', c: 'all' }); renderPlaces(); go('places'); return; }
  const sp = e.target.closest('[data-showplace]');
  if (sp) { const p = byCode[sp.dataset.showplace]; Object.assign(F, { q: '', g: gk(p), d: 'all', s: 'all', c: 'all' }); state.focus = p.code; renderPlaces(); $('#sheet').hidden = true; go('places'); return; }
  const em = e.target.closest('[data-embed]');
  if (em) { openEmbed(em.dataset.embed, em.dataset.ename); return; }
  const pk = e.target.closest('[data-pick]');
  if (pk && !e.target.closest('a, [data-place], [data-embed]')) { const sec = pk.closest('section'); if (sec) { pickItem(sec.id.replace('tab-', ''), pk.dataset.pick, 'card'); return; } }
  const el = e.target.closest('[data-place]'); if (el) openPlace(el.dataset.place);
});

/* ---------- plan ---------- */
const NOTES = [
  'เวลาบัส / HSR / รถไฟป่า และราคาทั้งหมดเป็นค่าประมาณจากแหล่งข้อมูลที่ไม่ตรงกัน เช็คกับเว็บทางการก่อนจอง',
  'ตั๋วรถไฟป่าพระอาทิตย์ขึ้นจู้ซาน (เช้า 17) จองออนไลน์ได้ราว 12–15 วันก่อน (~ต้น ธ.ค.) รอบเวลาประกาศวันก่อน',
  'บัสตรงอาลีซาน → SML (Yuanlin 6739) มีวันละ ~2 เที่ยว ที่นั่งน้อย · สำรอง: เจียอี้ → HSR ไถจง → บัส 6670 จะถึง SML ค่ำ',
  'ที่พักอาลีซาน (คืน 16) และ SML (คืน 17) จองก่อน แบบยกเลิกฟรี · Alishan Hotel ราคาสูงมาก (~US$385–750 ต่อคืน)',
  'อูไหลอยู่เย็นวันศุกร์ ถ้าถึงไทเปช้ากว่า ~15:30 ให้เลื่อนไปเช้าวันอาทิตย์ (ออก ~08:00 และถึงสนามบินไม่เกิน ~17:00)',
  'ยังไม่มีพยากรณ์จริงของ 16–20 ธ.ค. อากาศในแต่ละวันเป็นค่าเฉลี่ยเดือน ธ.ค. · เช็คพยากรณ์ (CWA / Windy) อีกครั้ง ~11–13 ธ.ค. · เช็คล่าสุด: ยังไม่ได้เช็ค',
];
const OVERVIEW = {
  D1: 'เถาหยวน → เจียอี้ → อาลีซาน', D2: 'อาลีซาน (จู้ซาน) → SML', D3: 'SML → ไถจง → ไทเป → อูไหล',
  D4: 'ไทเป → จีหลง → จิ่วเฟิ่น → เมี่ยวโข่ว → ไทเป', D5: 'ซีเหมินติง → สนามบิน',
};
function dayCosts(day) {
  const rows = [];
  D.items.forEach((i, idx) => {
    const m = COST_DAYS.find(c => i.item.includes(c.m));
    if (m && m.days.includes(day)) rows.push({ name: i.item.replace(/\s*\(.*$/, '').replace(/ ✅.*$/, ''), v: calc(i, idx).total / m.days.length });
  });
  return rows;
}
const subTabs = cur => `<div class="segwrap"><div class="seg">${[['all', 'ภาพรวม'], ...DAYS.map(d => [d.day, d.day])].map(([v, t]) => `<button class="${v === cur ? 'on' : ''}" data-day="${v}">${t}</button>`).join('')}</div></div>`;
function bindDay(root) {
  $$('[data-day]', root).forEach(b => b.onclick = () => { go('plan', b.dataset.day); });
  $$('[data-goto]', root).forEach(b => b.onclick = () => go(b.dataset.goto));
}
let miniMap = null;
function drawDayMap(el, stops, color) {
  const m = L.map(el, { scrollWheelZoom: false, dragging: !L.Browser.mobile });
  baseTiles(m);
  addFullscreen(m);
  const items = drawDayRoute(m, stops, color);
  const pts = stops.map(s => [s.lat, s.lng]);
  const group = L.layerGroup().addTo(m);
  miniMap = m;
  setTimeout(() => {
    m.invalidateSize();
    if (pts.length) m.fitBounds(pts, { padding: [36, 36], maxZoom: 14 }); else m.setView([24.3, 121.1], 8);
    spreadPins(m, group, items);
  }, 60);
}
function drawDayRoute(target, stops, color) {
  for (let i = 1; i < stops.length; i++) addLeg(target, stops[i - 1], stops[i], color);
  return stops.map(s => ({ lat: s.lat, lng: s.lng, label: s.mark, cls: s.sq ? 'sq' : '', color, tip: `${s.mark}. ${s.name}` }));
}
// เส้นทางทั้งทริป: จุดหลักเรียงตามลำดับที่ไป (ไทเปที่พักแวะซ้ำ ใช้เลขเดิม)
const KEY = [
  ['TPE', 'สนามบินเถาหยวน', 'D1 · D5'], ['HSR_TY', 'HSR เถาหยวน', 'D1'], ['HSR_CY', 'HSR เจียอี้', 'D1'], ['CHIAYI_STN', 'สถานีรถไฟเจียอี้', 'D1'], ['E1', 'อาลีซาน', 'D1–D2'],
  ['HOTEL_SML', 'SML อีต้าเส้า', 'D2–D3'], ['HSR_TC', 'HSR ไถจง', 'D3'], ['HOTEL_TPE', 'ไทเป ซีเหมินติง', 'D3–D5'], ['B1', 'อูไหล', 'D3'],
  ['C2', 'จีหลง', 'D4'], ['D1', 'จิ่วเฟิ่น', 'D4'],
];
const KEY_LEGS = [
  ['TPE', 'HSR_TY', 'D1'], ['HSR_TY', 'HSR_CY', 'D1'], ['HSR_CY', 'CHIAYI_STN', 'D1'], ['CHIAYI_STN', 'E1', 'D1'], ['E1', 'HOTEL_SML', 'D2'],
  ['HOTEL_SML', 'HSR_TC', 'D3'], ['HSR_TC', 'HOTEL_TPE', 'D3'], ['HOTEL_TPE', 'B1', 'D3'], ['B1', 'HOTEL_TPE', 'D3', .006],
  ['HOTEL_TPE', 'C2', 'D4'], ['C2', 'D1', 'D4'], ['D1', 'C2', 'D4', .006], ['C2', 'HOTEL_TPE', 'D4', .006], ['HOTEL_TPE', 'TPE', 'D5'],
];
function drawOverviewRoute(target) {
  const pts = [], items = [];
  KEY_LEGS.forEach(([a, b, d, off]) => addLeg(target, resolveLoc(a), resolveLoc(b), dayColor(d), off || 0));
  KEY.forEach(([k, name], i) => { const s = resolveLoc(k); pts.push([s.lat, s.lng]); items.push({ lat: s.lat, lng: s.lng, label: i + 1, tip: `${i + 1}. ${name}` }); });
  return { pts, items };
}
const routeFlow = () => `<div class="flow">${KEY.map(([k, n, d], i) => `<span class="fi"><b>${i + 1}</b>${esc(n)}<small>${d}</small></span>`).join('<span class="fa">›</span>')}</div>
  <div class="dkey">${DAYS.map(d => `<span><i style="background:${dayColor(d.day)}"></i>${d.day} ${esc(OVERVIEW[d.day].split(' → ')[0])} → ${esc(OVERVIEW[d.day].split(' → ').slice(-1)[0])}</span>`).join('')}</div>`;
function renderPlan() {
  if (miniMap) { miniMap.remove(); miniMap = null; }
  if (state.day === 'all') renderOverview(); else renderDay();
}
function daysLeft() {
  const now = nowTW();
  if (now < TRIP_START) return { n: Math.ceil((TRIP_START - now) / 864e5), l: 'วันก่อนออกเดินทาง' };
  if (now < TRIP_END) return { n: Math.floor((now - TRIP_START) / 864e5) + 1, l: 'วันของทริป' };
  return { n: 0, l: 'จบทริปแล้ว' };
}
function renderOverview() {
  const done = store.get('tw2026-todo-v1') || {};
  const all = TODO.flatMap(g => g.items), nd = all.filter(x => done[x.id]).length;
  const urgent = all.filter(x => x.due === 'ทันที' && !done[x.id]);
  const total = costTotal(), dl = daysLeft();
  const cats = {}; D.items.forEach((i, idx) => { cats[i.cat] = (cats[i.cat] || 0) + calc(i, idx).total; });
  const catRows = Object.entries(cats).sort((a, b) => b[1] - a[1]), sub = Object.values(cats).reduce((a, b) => a + b, 0);
  const R = 26, CIRC = 2 * Math.PI * R;
  $('#tab-plan').innerHTML = `<div class="hero"><p class="eyebrow">16–20 ธ.ค. 2569 · 2 คน</p><h1>ไต้หวัน<br>5 วัน 4 คืน</h1><p class="sub">ไม่เช่ารถ ใช้ HSR บัส และ MRT</p>
      <p class="cta">${TODAY ? `<button class="btn" data-day="${TODAY.day}" style="margin:0 8px 0 0">วันนี้ ${TODAY.day} ›</button>` : ''}<button class="more" data-day="D1">ดูแผนรายวัน</button><button class="more" data-places="plan">ดูสถานที่ในแผน</button><button class="more" data-foods="plan">ดูร้านอาหาร</button><button class="more" data-hotels="plan">ดูที่พัก</button><button class="more" data-goto="transport">ดูตั๋วและการเดินทาง</button><button class="more" data-goto="cost">ดูงบ</button></p></div>
    ${subTabs('all')}
    <div class="bento">
      <div class="w"><div class="wl">นับถอยหลัง</div><div class="wn">${dl.n}<small>วัน</small></div><div class="wd">${dl.l}</div></div>
      <div class="w"><div class="wl">งบรวม</div><div class="wn">฿${thb(total)}</div><div class="wd">2 คน · คนละ ฿${thb(total / C.s.people)}</div></div>
      <div class="w c2"><div class="wl">เที่ยวบิน · จองแล้ว</div>
        <div class="wrow"><span>16 ธ.ค. VZ566</span><b>BKK 01:50 → TPE 06:30</b></div>
        <div class="wrow"><span>20 ธ.ค. VZ569</span><b>TPE 19:50 → BKK 22:50</b></div>
        <div class="wd">ทั้งสองเที่ยวใช้ Terminal 1 · ไม่มีสัมภาระโหลดฟรี</div></div>
      <div class="w c2 r2 flush"><div id="ovmap" class="mini"></div></div>
      <div class="w c2"><div class="wl">ที่พัก 4 คืน</div>
        <div class="wrow"><span>16 ธ.ค.</span><b>อาลีซาน</b></div>
        <div class="wrow"><span>17 ธ.ค.</span><b>SML อีต้าเส้า</b></div>
        <div class="wrow"><span>18–19 ธ.ค.</span><b>ไทเป ซีเหมินติง</b></div>
        <div class="wd">ยังไม่ได้จอง · ดูตัวเลือกและราคาในหน้ารายวัน</div><button class="more" data-hotels="plan" style="font-size:15px;margin-top:8px">ดูตัวเลือกที่พัก</button></div>
      <div class="w"><div class="wl">เตรียมตัว</div>
        <div class="hrow" style="margin-top:8px"><svg class="ring" viewBox="0 0 64 64"><circle cx="32" cy="32" r="${R}" fill="none" stroke="var(--line)" stroke-width="7"/><circle cx="32" cy="32" r="${R}" fill="none" stroke="var(--btn)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC * (1 - nd / all.length)}" transform="rotate(-90 32 32)"/></svg><div class="wn" style="margin:0;font-size:30px">${nd}/${all.length}</div></div>
        <div class="wd">ข้อที่ทำแล้ว</div></div>
      <div class="w"><div class="wl">อุณหภูมิปกติ ธ.ค.</div><div class="wn">0–21<small>°C</small></div><div class="wd">จู้ซานเช้ามืด 0–8° ไทเป 14–21° · ฝนบ่อย</div></div>
      <div class="w c4"><div class="wl">ลำดับเส้นทาง · เลขตรงกับหมุดบนแผนที่</div>${routeFlow()}</div>
      <div class="w c4"><div class="wl">เส้นทาง 5 วัน</div><div class="timeline">${DAYS.map(d => `<button class="tl-d" data-day="${d.day}"><div class="e">${d.day} · ${esc(WD[d.wd] || d.wd)} ${dayDate(d).getDate()}</div><div class="t">${esc(OVERVIEW[d.day])}</div><div class="s">${d.day === 'D5' ? 'บินกลับ 19:50' : 'นอน ' + esc(HOTELS[HOTEL_FOR_DAY[d.day]].title.split(' · ')[0])}</div></button>`).join('')}</div></div>
      <div class="w c2"><div class="wl">งบแยกตามหมวด</div>${catRows.map(([k, v]) => `<div style="margin-top:12px"><div class="wrow" style="padding:0;border:0"><span style="color:var(--ink)">${esc(k)}</span><b>฿${thb(v)}</b></div><div class="bar1" style="width:${Math.max(1, v / sub * 100)}%"></div></div>`).join('')}</div>
      <div class="w c2"><div class="wl">ต้องทำก่อน${urgent.length ? ` (${urgent.length})` : ''}</div>${urgent.length ? urgent.map(x => `<div class="wrow"><span style="color:var(--ink)">${esc(x.t)}</span></div>`).join('') : '<div class="wd">ไม่มีรายการเร่งด่วน</div>'}<button class="more" data-goto="todo" style="margin-top:12px;font-size:16px">เปิดรายการเตรียมตัว</button></div>
    </div>
    ${blk('แต่ละวัน', `<div class="stack">${DAYS.map(d => {
      const info = DAY_INFO[d.day], cost = dayCosts(d.day).reduce((s, r) => s + r.v, 0);
      return `<button class="day-card" data-day="${d.day}"><div class="e">${d.day} · ${esc(dayLabel(d))}</div><div class="t">${esc(OVERVIEW[d.day])}</div><div class="d">${esc(info.headline)}</div><div class="m">${info.book.length ? `ต้องจอง ${info.book.length} รายการ` : 'ไม่ต้องจองล่วงหน้า'} · ${info.schedule.length} ช่วงเวลา · ~฿${thb(cost)}</div><span class="go">ดูรายละเอียด</span></button>`; }).join('')}</div>`)}
    ${blk('ต้องเช็คก่อนจอง', tile(`<ul class="ul">${NOTES.map(n => `<li>${esc(n)}</li>`).join('')}</ul>`))}`;
  bindDay($('#tab-plan'));
  const el = $('#ovmap'); if (!el) return;
  const m = L.map(el, { scrollWheelZoom: false, dragging: !L.Browser.mobile });
  baseTiles(m);
  addFullscreen(m);
  const { pts, items } = drawOverviewRoute(m);
  const group = L.layerGroup().addTo(m);
  miniMap = m;
  setTimeout(() => { m.invalidateSize(); m.fitBounds(pts, { padding: [30, 30] }); spreadPins(m, group, items); }, 60);
}
function hotelBlock(hk, dayId) {
  const h = HOTELS[hk], l = resolveLoc(h.loc);
  return `<div class="small"><b style="color:var(--ink)">${esc(h.title)}</b>${(dayId === 'D4' || dayId === 'D5') ? ' · ที่พักเดียวกับคืนที่แล้ว' : ''}</div>
    <p class="plain" style="margin:6px 0 16px;font-size:15.5px">${esc(h.why)}</p>
    ${h.picks.map((p, k) => `<div class="item"><b>${k + 1}. ${esc(p.n)}</b><div class="small">${esc(p.d)}</div><div class="price">ราคา: ${esc(p.price)}</div><div class="small"><a href="${gmSearch(p.q)}" target="_blank" rel="noopener">ดูในแผนที่</a></div></div>`).join('')}
    <p class="note">คัดจากเว็บจองห้องและรีวิว ไม่ใช่การจัดอันดับทางการ ราคาเป็นตัวอย่างคนละวัน ไม่ใช่ราคาวันที่ไป ต้องกรอกวันที่เช็คเอง · <a href="${gmSearch(l.q)}" target="_blank" rel="noopener">ดูย่านนี้ในแผนที่</a></p><button class="more" data-hotels="${hk}" style="font-size:16px;margin-top:10px">ดูตัวเลือกทั้งหมดในแท็บที่พัก</button>`;
}
function computeSteps(d) {
  const info = DAY_INFO[d.day];
  const stops = []; let prev = null;
  const steps = info.schedule.map(s => {
    const l = resolveLoc(s.loc); let n = null, from = null;
    if (l) {
      const hotel = l.key.startsWith('HOTEL_'), air = l.key === 'TPE';
      if (!prev || prev.key !== l.key) stops.push({ ...l, mark: hotel ? 'H' : air ? 'A' : String(stops.filter(x => !x.sq).length + 1), sq: hotel || air });
      n = [...stops].reverse().find(x => x.key === l.key).mark; from = prev && prev.key !== l.key ? prev : null; prev = l;
    }
    return { ...s, l, n, from };
  });
  return { steps, stops };
}
function renderDay() {
  const d = DAYS.find(x => x.day === state.day), i = DAYS.indexOf(d), info = DAY_INFO[d.day];
  const places = (ORDER[d.day] || []).map(c => byCode[c]);
  const legs = LEGS.filter(l => l.day === d.day);
  const visit = places.reduce((s, p) => s + p.hours, 0), travel = legs.reduce((s, l) => s + l.min, 0) / 60;
  const left = d.avail - visit - travel;
  const status = left < 0 ? 'แน่นเกิน' : left < 1.5 ? 'ตึง' : 'โอเค';
  const costs = dayCosts(d.day), ctot = costs.reduce((s, r) => s + r.v, 0);
  const dayTr = TRANSPORT.filter(x => x.d === d.day);
  const dayFoods = FOODS.filter(x => x.day === d.day);
  const { steps, stops } = computeSteps(d);
  const live = TODAY && TODAY.day === d.day ? { ...TODAY, ...stepNow(steps, TODAY.min) } : null;
  const rowCls = k => !live ? '' : k === live.cur ? ' now' : k === live.next ? ' next' : k < live.cur ? ' past' : '';
  const liveBar = live ? `<div class="live"><span class="dot"></span><div><div class="lt">วันนี้ · เวลาไต้หวัน ${live.hm}</div>${live.cur >= 0 ? `<div><b>ตอนนี้</b> ${esc(steps[live.cur].title)}</div>` : '<div>ยังไม่ถึงกิจกรรมแรกของวัน</div>'}${live.next >= 0 ? `<div class="small"><b>ถัดไป ${esc(steps[live.next].t)}</b> ${esc(steps[live.next].title)}</div>` : ''}</div></div>` : '';
  const main = `
    ${blk('ตารางเวลา', liveBar + tile(steps.map((s, k) => `<div class="sr k-${s.k}${rowCls(k)}"><div class="st">${esc(s.t)}</div><div><div class="stt">${esc(s.title)}</div>${s.d ? `<div class="sd">${esc(s.d)}</div>` : ''}
      ${(s.dur || s.cost || s.l || (s.k === 'eat' && dayFoods.length)) ? `<div class="meta">${[s.dur ? esc(s.dur) : '', s.cost ? esc(s.cost) : '', s.k === 'eat' && dayFoods.length ? `<button class="lnk" data-foods="${d.day}">ดูร้านแนะนำ</button>` : '', s.l ? `<a href="${gmSearch(s.l.q)}" target="_blank" rel="noopener">แผนที่ ${s.n}</a>` : '', s.l && s.from ? `<a href="${gmDir(s.from.q, s.l.q)}" target="_blank" rel="noopener">เส้นทางจากจุดก่อนหน้า</a>` : ''].filter(Boolean).join('<i>·</i>')}</div>` : ''}
      ${s.tip ? `<div class="tip">${esc(s.tip)}</div>` : ''}</div></div>`).join('') + `<p class="note">${esc(d.note)} · เวลาทั้งหมดเป็นค่าประมาณ</p>`))}
    ${blk('ที่พักแนะนำ', tile(hotelBlock(HOTEL_FOR_DAY[d.day], d.day)))}
    ${info.book.length ? blk('ต้องจองหรือซื้อ', tile(info.book.map(b => `<div class="item"><b>${esc(b.t)}</b><span class="due">${esc(b.due)}</span><div class="small">${esc(b.d)}</div></div>`).join('') + '<button class="more" data-goto="todo" style="margin-top:14px;font-size:16px">เปิดรายการเตรียมตัว</button>')) : ''}
    ${places.length ? blk('สถานที่', `<div class="strip">${places.map(p => photo(p)).join('')}</div><button class="more" data-places="${d.day}" style="margin-top:12px;font-size:16px">ดูในแท็บสถานที่</button>`) : ''}
    ${dayFoods.length ? blk('ร้านอาหารแนะนำวันนี้', tile(dayFoods.map(x => `<button class="item trlink" data-foods="${d.day}"><b>${esc(x.n)}</b> <span class="small">· ${esc(x.meal)}</span><div class="small">${esc(x.dish)} ${stTag(x.s)}</div></button>`).join('') + `<button class="more" data-foods="${d.day}" style="margin-top:12px;font-size:16px">ดูทั้งหมดในแท็บร้านอาหาร</button>`), 'ร้านที่เลือกให้เข้ากับเส้นทางและช่วงเวลาของวัน · เช็คเวลาเปิดก่อนไป') : ''}
    ${dayTr.length ? blk('ตั๋วและวิธีซื้อ', tile(dayTr.map((x, k) => { const r = x.rows.find(rw => /ราคา/.test(rw[0])) || x.rows[0]; return `<button class="item trlink" data-tr="${d.day}-${k}"><b>${esc(x.t)}</b><div class="small">${esc(r[0])}: ${esc(r[1].length > 90 ? r[1].slice(0, 90) + '…' : r[1])} ${stTag(r[2])}</div><span class="go2">ดูวิธีซื้อและราคา</span></button>`; }).join('') + '<p class="note">กดเพื่อไปแท็บเดินทาง · ดูป้ายสถานะว่าข้อไหนยืนยันกับหน้าทางการแล้ว</p>'), 'ซื้อที่ไหน ราคา และตารางเวลาของแต่ละช่วงวันนี้') : ''}
    ${blk('การเดินทาง', tile(legs.map(l => `<div class="item"><div style="display:flex;justify-content:space-between;gap:12px"><b>${esc(l.frm)} → ${esc(l.to)}</b><span class="small" style="white-space:nowrap">${l.min >= 60 ? fmtH(l.min / 60) + ' ชม.' : l.min + ' น.'}</span></div><div class="small">${esc(l.mode)}${l.km ? ` · ${l.km} กม.` : ''}${l.note ? ` · ${esc(l.note)}` : ''}</div></div>`).join('')))}`;
  const aside = `
    ${blk('แผนที่วันนี้', `<div class="tile flush"><div id="daymap" class="mini"></div></div><div class="stops">${stops.map(s => `<a href="${gmSearch(s.q)}" target="_blank" rel="noopener"><b>${s.mark}</b>${esc(s.name)}</a>`).join('')}</div><p class="note">ตำแหน่งโดยประมาณ กดชื่อเพื่อเปิด Google Maps</p>`)}
    ${blk('อากาศและการเตรียมตัว', tile(`<dl class="kv" style="grid-template-columns:78px 1fr;font-size:15.5px"><dt>อากาศ</dt><dd>${esc(d.wx)}</dd><dt>เตรียม</dt><dd>${esc(d.pack)}</dd><dt>ถ้าฝนตก</dt><dd>${esc(d.rain)}</dd></dl>`))}
    ${blk('แผนสำรอง', tile(`<ul class="ul">${info.backup.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`))}
    ${info.food.length ? blk('ของกินที่น่าลอง', tile(`<div>${info.food.map(f => `<span class="chip">${esc(f)}</span>`).join('')}</div><p class="note" style="margin-top:6px">ข้อแนะนำทั่วไป ไม่ได้เช็คร้านหรือจองไว้</p>`)) : ''}
    ${blk('ค่าใช้จ่ายวันนี้', tile(costs.map(r => `<div class="line"><span>${esc(r.name)}</span><span>฿${thb(r.v)}</span></div>`).join('') + `<div class="line"><b>รวม</b><b>฿${thb(ctot)}</b></div><p class="note">ไม่รวมตั๋วเครื่องบิน สัมภาระ eSIM ประกัน · แก้ราคาได้ที่แท็บงบ</p>`))}`;
  $('#tab-plan').innerHTML = subTabs(d.day) + `
    <div class="hero" style="padding:28px 0 20px;text-align:left"><p class="eyebrow">${esc(d.day)} · ${esc(dayLabel(d))}</p><h1 style="font-size:40px">${esc(OVERVIEW[d.day])}</h1><p class="sub" style="font-size:19px">${esc(info.headline)}</p></div>
    <div class="stat-grid">
      <div class="stat"><b>${fmtH(visit)}<small style="font-size:16px"> ชม.</small></b><span>เที่ยว · ${status}</span></div>
      <div class="stat"><b>${fmtH(travel)}<small style="font-size:16px"> ชม.</small></b><span>เดินทาง · จากที่มี ${d.avail} ชม.</span></div>
      <div class="stat"><b>฿${thb(ctot)}</b><span>งบวันนี้ 2 คน</span></div>
      <div class="stat"><b style="font-size:20px;line-height:1.25">${esc(d.sleep.split('(')[0].trim())}</b><span>นอน</span></div>
    </div>
    <div class="cols"><div class="main">${main}</div><div class="aside">${aside}</div></div>
    <div class="pn">${i > 0 ? `<button data-day="${DAYS[i - 1].day}">‹ ${DAYS[i - 1].day}</button>` : '<button data-day="all">‹ ภาพรวม</button>'}${i < DAYS.length - 1 ? `<button data-day="${DAYS[i + 1].day}">${DAYS[i + 1].day} ›</button>` : '<button data-day="all">ภาพรวม ›</button>'}</div>`;
  bindDay($('#tab-plan'));
  drawDayMap($('#daymap'), stops, dayColor(d.day));
}
function photo(p) {
  const src = img(p);
  return `<button class="ph" data-place="${p.code}">${src ? `<img src="${esc(src)}" alt="" loading="lazy">` : '<div class="noimg">ยังไม่มีรูป</div>'}<div class="n">${esc(p.name)}</div><div class="s">${esc(p.hours)} ชม. · ${esc(p.best)}</div></button>`;
}

/* ---------- map tab ---------- */
let map, layer, pins, mapFilter = 'plan';
function initMap() {
  if (map) return;
  map = L.map('map').setView([24.3, 121.1], 8);
  baseTiles(map);
  addFullscreen(map);
  layer = L.layerGroup().addTo(map);
  pins = L.layerGroup().addTo(map);
  const opts = [['plan', 'ทั้งทริป'], ...DAYS.map(d => [d.day, d.day]), ['all', 'ทุกสถานที่']];
  const bar = $('#mapbar');
  const paint = () => { bar.innerHTML = opts.map(([v, t]) => `<button class="${v === mapFilter ? 'on' : ''}" data-f="${v}">${t}</button>`).join(''); $$('#mapbar button').forEach(b => b.onclick = () => { mapFilter = b.dataset.f; paint(); drawMap(); }); };
  paint();
}
function drawMap() {
  if (!map) return;
  layer.clearLayers();
  let pts = [], items = [], list = '';
  if (mapFilter === 'plan') {
    const r = drawOverviewRoute(layer); pts = r.pts; items = r.items;
    list = routeFlow();
  } else if (mapFilter === 'all') {
    P.forEach(p => { items.push({ lat: p.lat, lng: p.lng, label: p.code, cls: p.day ? '' : 's', color: p.day ? dayColor(p.day) : '', tip: p.name, click: () => openPlace(p.code) }); pts.push([p.lat, p.lng]); });
    list = '<p class="small">หมุดสีคือสถานที่ที่วางในแผน หมุดเล็กสีเทาคือสถานที่ที่ยังไม่วาง · กดหมุดเพื่อดูรายละเอียด</p>';
  } else {
    const d = DAYS.find(x => x.day === mapFilter), color = dayColor(d.day);
    const { stops } = computeSteps(d);
    items = drawDayRoute(layer, stops, color);
    pts = stops.map(s => [s.lat, s.lng]);
    list = `<div class="small" style="margin-bottom:8px"><b style="color:var(--ink)">${esc(d.day)} · ${esc(dayLabel(d))}</b> · ${esc(OVERVIEW[d.day])}</div><div class="stops">${stops.map(s => `<a href="${gmSearch(s.q)}" target="_blank" rel="noopener"><b>${s.mark}</b>${esc(s.name)}</a>`).join('')}</div>`;
  }
  if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 13 });
  spreadPins(map, pins, items);
  $('#maplist').innerHTML = list;
}

/* ---------- places ---------- */
/* ---------- maps inside tabs ---------- */
const TM = {}, TMITEMS = {};
const mapBlock = key => `<div class="tmwrap"><div id="tm-${key}" class="tm"></div><div id="ti-${key}" class="tinfo"><span class="small">กดรายการเพื่อดูตำแหน่งบนแผนที่</span></div></div>`;
function ensureTabMap(key) {
  const el = document.getElementById('tm-' + key);
  if (!el) return null;
  let s = TM[key];
  if (s && s.el === el) return s;
  if (s) s.map.remove();
  const m = L.map(el, { scrollWheelZoom: false, dragging: !L.Browser.mobile });
  baseTiles(m); addFullscreen(m);
  s = TM[key] = { el, map: m, lines: L.layerGroup().addTo(m), pins: L.layerGroup().addTo(m), sel: null };
  return s;
}
function refreshTabMap(key, fit = true) {
  const s = ensureTabMap(key);
  if (!s || !s.el.offsetParent || !TMITEMS[key]) return;
  const { items, lines } = TMITEMS[key](s.sel);
  s.lines.clearLayers();
  (lines || []).forEach(l => addLeg(s.lines, l.a, l.b, l.color, 0, l.w, l.op));
  s.items = items;
  s.map.invalidateSize();
  const pts = items.map(i => [i.lat, i.lng]);
  if (fit && pts.length) s.map.fitBounds(pts, { padding: [36, 36], maxZoom: 14 });
  else if (!pts.length) s.map.setView([24.3, 121.1], 8);
  spreadPins(s.map, s.pins, items.map(i => ({ ...i, cls: (i.id === s.sel ? 'sel ' : '') + (i.cls || ''), tip: i.name, click: () => pickItem(key, i.id, 'pin') })));
}
function infoHtml(it) {
  return `<div class="ti"><div class="tit"><b>${esc(it.name)}</b><div class="small">${esc(it.sub || '')}</div></div>
    <div class="tbtn">${it.place ? `<button class="more" data-place="${esc(it.place)}">รายละเอียด</button>` : ''}<a href="${gmSearch(it.q)}" target="_blank" rel="noopener">Google Maps</a>${it.embed === false ? '' : `<button class="more" data-embed="${esc(it.q)}" data-ename="${esc(it.name)}">ตำแหน่งจริง</button>`}</div></div>
    ${it.note ? `<div class="small tnote">${esc(it.note)}</div>` : ''}`;
}
function pickItem(key, id, source) {
  const s = ensureTabMap(key);
  if (!s) return;
  if (!s.items) refreshTabMap(key, false);
  const it = (s.items || []).find(x => x.id === id);
  if (!it) return;
  s.sel = id;
  $('#ti-' + key).innerHTML = infoHtml(it);
  $$(`#tab-${key} [data-pick]`).forEach(e => e.classList.toggle('sel', e.dataset.pick === id));
  refreshTabMap(key, false);
  if (it.bounds && it.bounds.length > 1) s.map.fitBounds(it.bounds, { padding: [40, 40], maxZoom: 12 });
  else s.map.flyTo([it.lat, it.lng], Math.max(s.map.getZoom(), it.zoom || 13), { duration: .6 });
  if (source === 'pin') document.querySelector(`#tab-${key} [data-pick="${id}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
function openEmbed(q, name) {
  $('#sheetBox').innerHTML = `<button class="sheet-x" data-close aria-label="ปิด">✕</button>
    <div class="sb" style="padding-top:22px"><h3>${esc(name)}</h3><p class="small" style="margin:6px 0 12px">แผนที่ของ Google ค้นด้วยชื่อ ถ้าไม่ขึ้นหรือขึ้นผิดที่ ให้เปิดใน Google Maps แล้วดูที่อยู่และรีวิวยืนยันอีกครั้ง</p></div>
    <iframe class="embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed&hl=th"></iframe>
    <div class="sb"><div class="links"><a href="${gmSearch(q)}" target="_blank" rel="noopener">เปิดใน Google Maps</a></div></div>`;
  $('#sheet').hidden = false;
}
const foodAnchor = f => ({ 'เจียอี้': 'CHIAYI_STN', 'อาลีซาน': 'E1', 'SML': /สุ่ยเซอ/.test(f.n) ? 'SHUISHE' : 'HOTEL_SML', 'อูไหล': 'B1', 'จีหลง': 'C1', 'จิ่วเฟิ่น': 'D1', 'ไทเป': /Raohe|เหราเหอ/.test(f.n) ? 'RAOHE' : /Shilin|ซื่อหลิน/.test(f.n) ? 'SHILIN' : 'HOTEL_TPE' }[f.z]);
const hotelAnchor = h => h.z === 'อาลีซาน' ? 'HOTEL_ALI' : h.z === 'อาลีซาน (นอกอุทยาน)' ? (h.id === 'e34' ? 'XIDING' : ['e5', 'e6'].includes(h.id) ? 'FANLU' : 'FENQIHU') : h.z === 'SML' ? (h.tags.includes('pier') ? 'HOTEL_SML' : 'SML_CENTER') : h.z === 'เจียอี้' ? 'CHIAYI_STN' : 'HOTEL_TPE';
const AREA_NOTE = 'หมุดอยู่ที่ย่านนี้ ไม่ใช่ที่อยู่จริงของร้าน/โรงแรม · กด “ตำแหน่งจริง” หรือ Google Maps เพื่อดูจุดที่แน่ชัด';

const F = { q: '', g: 'all', d: 'all', s: 'all', c: 'all' };
const placeCard = p => {
  const src = img(p), dc = p.day ? dayColor(p.day) : '';
  return `<button class="ph ${p.day ? 'in' : ''}" data-pick="${p.code}" ${p.day ? `style="--dc:${dc}"` : ''}><div class="pw"><span class="cn">${p.code}</span>${src ? `<img src="${esc(src)}" alt="" loading="lazy">` : '<div class="noimg">ยังไม่มีรูป</div>'}${p.day ? `<span class="pb">ในแผน · ${p.day}</span>` : ''}</div><div class="n">${esc(p.name)}</div><div class="s">${esc(GROUP_SHORT[gk(p)])} · ${esc(p.hours)} ชม.</div><div class="tg">${tagsOf(p).slice(0, 3).map(x => `<span>${esc(x)}</span>`).join('')}</div></button>`;
};
function renderPlaces() {
  const nPlan = P.filter(p => p.day).length;
  $('#tab-places').innerHTML = `<div class="hero" style="text-align:left;padding:40px 0 0"><h1>สถานที่</h1><p class="sub">${P.length} แห่ง · <span style="color:var(--ink)">ในแผนของเรา ${nPlan} แห่ง</span> · กดรูปเพื่อดูรายละเอียด</p></div>
    <div class="filters" style="margin-top:22px"><input id="q" placeholder="ค้นหา เช่น น้ำพุร้อน ตลาดกลางคืน" value="${esc(F.q)}">
      <select id="fg"><option value="all">ทุกโซน</option>${Object.entries(GROUP_SHORT).map(([k, v]) => `<option value="${k}" ${F.g === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <select id="fd"><option value="all">ทุกวัน</option>${DAYS.map(d => `<option value="${d.day}" ${F.d === d.day ? 'selected' : ''}>${d.day}</option>`).join('')}</select></div>
    <div style="margin-top:14px"><div class="seg" id="scope">${[['all', 'ทั้งหมด'], ['plan', `ในแผน (${nPlan})`], ['none', `ยังไม่วาง (${P.length - nPlan})`]].map(([v, tx]) => `<button class="${F.s === v ? 'on' : ''}" data-s="${v}">${tx}</button>`).join('')}</div></div>
    <div class="cats" id="cats"><button class="fchip ${F.c === 'all' ? 'on' : ''}" data-c="all">ทุกประเภท</button>${CATS.map(c => `<button class="fchip ${F.c === c[0] ? 'on' : ''}" data-c="${c[0]}">${c[1]} <small>${P.filter(p => inCat(p, c)).length}</small></button>`).join('')}</div>
    ${mapBlock('places')}
    <div id="pout"></div>`;
  const draw = () => {
    const q = F.q.trim().toLowerCase(), cat = CATS.find(c => c[0] === F.c);
    const list = P.filter(p => (F.g === 'all' || gk(p) === F.g) && (F.d === 'all' || p.day === F.d) && (F.s === 'all' || (F.s === 'plan' ? p.day : !p.day)) && (!cat || inCat(p, cat)) && (!q || (p.name + ' ' + p.tags + ' ' + p.code).toLowerCase().includes(q)));
    const plan = list.filter(p => p.day).sort((a, b) => a.day.localeCompare(b.day)), other = list.filter(p => !p.day);
    const sec = (title, arr) => arr.length ? `<h3 class="gh">${title} <span>${arr.length}</span></h3><div class="grid">${arr.map(placeCard).join('')}</div>` : '';
    $('#pout').innerHTML = (sec('ในแผนของเรา', plan) + sec(plan.length ? 'ตัวเลือกเพิ่มเติม' : 'สถานที่', other)) || '<p class="plain" style="margin-top:24px">ไม่มีสถานที่ตรงกับตัวกรอง</p>';
    TMITEMS.places = () => ({ items: list.map(p => ({ id: p.code, lat: p.lat, lng: p.lng, label: p.code, color: p.day ? dayColor(p.day) : '#8a949b', cls: p.day ? '' : 's', name: p.name, sub: `${p.code} · ${GROUP_SHORT[gk(p)]}${p.day ? ' · ในแผน ' + p.day : ''}`, q: p.search + ' Taiwan', place: p.code, embed: false, note: 'ตำแหน่งหมุดโดยประมาณ' })) });
    refreshTabMap('places', true);
  };
  draw();
  $('#q').oninput = e => { F.q = e.target.value; draw(); };
  $('#fg').onchange = e => { F.g = e.target.value; draw(); };
  $('#fd').onchange = e => { F.d = e.target.value; draw(); };
  $$('#scope button').forEach(b => b.onclick = () => { F.s = b.dataset.s; renderPlaces(); });
  $$('#cats button').forEach(b => b.onclick = () => { F.c = b.dataset.c; renderPlaces(); });
}

/* ---------- transport ---------- */
const stTag = s => `<span class="stt2 st-${STATUS[s][1]}">${STATUS[s][0]}</span>`;
const srcLinks = arr => (arr || []).map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>`).join(' · ');
const TR_ROUTES = [['TPE', 'HSR_TY'], ['HSR_TY', 'HSR_CY'], ['HSR_CY', 'CHIAYI_STN', 'ALI_STN'], ['ALI_STN'], ['ALI_STN', 'E2'], ['ALI_STN', 'SHUISHE'], ['SHUISHE', 'F1'], ['SHUISHE', 'HSR_TC'], ['HSR_TC', 'TPE_MAIN'], ['TPE_MAIN', 'XINDIAN', 'B1'], ['TPE_MAIN', 'C2', 'D1', 'C1', 'TPE_MAIN'], ['TPE_MAIN', 'TPE']];
if (TR_ROUTES.length !== TRANSPORT.length) console.warn('TR_ROUTES length mismatch');
TMITEMS.transport = sel => {
  const items = [], lines = [];
  TRANSPORT.forEach((x, i) => {
    const pts = (TR_ROUTES[i] || []).map(resolveLoc).filter(Boolean);
    if (!pts.length) return;
    const a = pts[0], b = pts[pts.length - 1], mid = pts.length > 1 ? { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 } : a;
    const on = sel === 't' + i;
    items.push({ id: 't' + i, lat: mid.lat, lng: mid.lng, label: i + 1, color: dayColor(x.d), name: x.t, sub: `${x.d} · ${pts.map(p => p.name).join(' → ')}`, q: b.q, bounds: pts.map(p => [p.lat, p.lng]), embed: false, note: 'เส้นตรงเชื่อมจุดคร่าว ๆ ไม่ใช่เส้นทางจริง · ราคาและวิธีซื้อดูในการ์ดของช่วงนี้' });
    for (let k = 1; k < pts.length; k++) lines.push({ a: pts[k - 1], b: pts[k], color: dayColor(x.d), w: on ? 7 : 3.5, op: sel && !on ? .45 : .9 });
  });
  return { items, lines };
};
function renderTransport() {
  const dayOf = d => DAYS.find(x => x.day === d);
  $('#tab-transport').innerHTML = `<div class="hero" style="text-align:left;padding:40px 0 0"><p class="eyebrow">ตั๋วและวิธีเดินทาง</p><h1>เดินทาง</h1><p class="sub">ซื้อที่ไหน ราคาเท่าไร เมื่อไรต้องจอง · แยกว่าอะไรยืนยันแล้ว อะไรยังไม่ยืนยัน</p></div>
    ${mapBlock('transport')}
    ${blk('อ่านก่อน', tile(`<p>ข้อมูลทั้งหมดค้นจากเว็บเมื่อ 22 พ.ย. 2569 <b>เครื่องที่ใช้ค้นเปิดหน้าเว็บทางการโดยตรงไม่ได้</b> จึงยืนยันได้แค่ข้อความที่เห็นในผลค้นหา แต่ละข้อมีป้ายสถานะ:</p>
      <div class="stlegend"><div>${stTag('off')} <span>ข้อความจากหน้าเว็บทางการที่เห็นในผลค้นหา (ยังไม่ได้เปิดอ่านหน้าเอง)</span></div><div>${stTag('sec')} <span>บล็อก ไกด์ หรือเว็บขายตั๋ว ตัวเลขอาจเก่าหรือไม่ตรงกัน</span></div><div>${stTag('no')} <span>ไม่พบข้อมูลที่เชื่อถือได้ ต้องเช็คเอง ผมไม่ได้เดา</span></div></div>
      <p class="note">ก่อนซื้อจริง ให้เปิดเว็บทางการเช็คราคาและเวลาอีกครั้ง: ${Object.values(LINKS).map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>`).join(' · ')}</p>`))}
    ${blk('ซื้อ/จองเมื่อไร', tile(WHEN.map(([k, v]) => `<div class="item"><b>${esc(k)}</b><div class="small" style="color:var(--ink)">${esc(v)}</div></div>`).join('')))}
    ${blk('แพ็กเกจและบัสที่เหมาะกับเรา', `<div class="stack">${PACKS.map(p => `<div class="tile"><div class="phead"><b>${esc(p.t)}</b><span class="verdict">${esc(p.v)}</span></div><p style="margin-top:8px;font-size:15.5px">${esc(p.body)}</p><p class="small" style="margin-top:8px">${srcLinks(p.src)}</p></div>`).join('')}</div>`, 'ส่วนนี้เป็นความเห็นของผมจากข้อมูลด้านล่าง ไม่ใช่ข้อมูลทางการ')}
    ${DAYS.map(d => { const items = TRANSPORT.filter(x => x.d === d.day); return items.length ? blk(`${d.day} · ${esc(dayLabel(d))}`, `<div class="stack">${items.map((x, k) => `<div class="tile pickable" id="tr-${d.day}-${k}" data-pick="t${TRANSPORT.indexOf(x)}"><div class="phead"><b><span class="cn2">${TRANSPORT.indexOf(x) + 1}</span>${esc(x.t)}</b></div>${x.rows.map(([lb, tx, s, src]) => `<div class="trow"><div class="tl2">${esc(lb)}</div><div class="tx">${esc(tx)} ${stTag(s)}${src && src.length ? `<div class="small" style="margin-top:4px">ดูเพิ่ม: ${srcLinks(src)}</div>` : ''}</div></div>`).join('')}</div>`).join('')}</div>`).replace('<div class="blk">', `<div class="blk" id="tr-${d.day}">`) : ''; }).join('')}`;
  refreshTabMap('transport', true);
}

/* ---------- food ---------- */
// รูปย่าน (ใช้รูปสถานที่เด่นของย่านนั้น ไม่ใช่รูปร้านหรือโรงแรมจริง)
const AREA_PHOTO = { 'เจียอี้': 'E7', 'อาลีซาน': 'E1', 'อาลีซาน (นอกอุทยาน)': 'E3', 'SML': 'F1', 'อูไหล': 'B1', 'จีหลง': 'C1', 'จิ่วเฟิ่น': 'D1', 'ไทเป': 'A1' };
const areaImg = z => { const p = byCode[AREA_PHOTO[z]], src = p && img(p); return src ? `<div class="fimg"><img src="${esc(src)}" alt="" loading="lazy"><span>รูปย่าน${esc(z.replace(/ \(.*/, ''))} ไม่ใช่รูปร้าน/ที่พัก</span></div>` : ''; };
const FF = { q: '', z: 'all', d: 'all', s: 'all', c: 'all' };
const ftName = k => (FTYPES.find(x => x[0] === k) || [k, k])[1];
const foodCard = (f, n) => `<div class="fd ${f.day ? 'in' : ''}" data-pick="${f.id}" ${f.day ? `style="--dc:${dayColor(f.day)}"` : ''}>${areaImg(f.z)}<span class="cn">${n}</span>
  ${f.day ? `<span class="pb2">ในแผน · ${f.day} · ${esc(f.meal)}</span>` : ''}
  <div class="fn">${esc(f.n)}</div>
  <div class="fz">${esc(f.z)}</div>
  <div class="fdish">${esc(f.dish)}</div>
  <div class="tg">${f.tags.map(k => `<span>${esc(ftName(k))}</span>`).join('')}</div>
  <p class="fnote">${esc(f.note)}</p>
  <div class="fmeta">${stTag(f.s)}<a href="${gmSearch(f.q + ' Taiwan')}" target="_blank" rel="noopener">แผนที่</a>${f.src.map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>`).join('')}</div>
</div>`;
function renderFood() {
  const nPlan = FOODS.filter(f => f.day).length;
  $('#tab-food').innerHTML = `<div class="hero" style="text-align:left;padding:40px 0 0"><p class="eyebrow">ร้านอาหารและของกิน</p><h1>ร้านอาหาร</h1><p class="sub">${FOODS.length} รายการ · <span style="color:var(--ink)">ในแผนของเรา ${nPlan} รายการ</span></p></div>
    <p class="note">คัดจากบล็อก ไกด์ และรีวิวที่ค้นเจอ ไม่ใช่การจัดอันดับทางการ <b>ไม่มีเวลาเปิด-ปิดหรือราคาที่ยืนยันแล้ว</b> ร้านเปลี่ยนบ่อย เช็คแผนที่/รีวิวล่าสุดก่อนไป ป้ายสถานะ: ${stTag('sec')} มีแหล่งรองสนับสนุน ${stTag('no')} ข้อมูลขัดแย้งหรือไม่ชัด</p>
    <div class="filters" style="margin-top:18px"><input id="fq" placeholder="ค้นหา เช่น ข้าวไก่งวง หมูป่า ไอศกรีม" value="${esc(FF.q)}">
      <select id="fz"><option value="all">ทุกโซน</option>${FZONES.map(z => `<option value="${z}" ${FF.z === z ? 'selected' : ''}>${z}</option>`).join('')}</select>
      <select id="fdd"><option value="all">ทุกวัน</option>${DAYS.map(d => `<option value="${d.day}" ${FF.d === d.day ? 'selected' : ''}>${d.day}</option>`).join('')}</select></div>
    <div style="margin-top:14px"><div class="seg" id="fscope">${[['all', 'ทั้งหมด'], ['plan', `ในแผน (${nPlan})`], ['none', `ตัวเลือกเพิ่ม (${FOODS.length - nPlan})`]].map(([v, tx]) => `<button class="${FF.s === v ? 'on' : ''}" data-s="${v}">${tx}</button>`).join('')}</div></div>
    <div class="cats" id="fcats"><button class="fchip ${FF.c === 'all' ? 'on' : ''}" data-c="all">ทุกประเภท</button>${FTYPES.map(([k, n]) => `<button class="fchip ${FF.c === k ? 'on' : ''}" data-c="${k}">${n} <small>${FOODS.filter(f => f.tags.includes(k)).length}</small></button>`).join('')}</div>
    ${mapBlock('food')}
    <div id="fout"></div>`;
  const draw = () => {
    const q = FF.q.trim().toLowerCase();
    const list = FOODS.filter(f => (FF.z === 'all' || f.z === FF.z) && (FF.d === 'all' || f.day === FF.d) && (FF.s === 'all' || (FF.s === 'plan' ? f.day : !f.day)) && (FF.c === 'all' || f.tags.includes(FF.c)) && (!q || (f.n + ' ' + f.dish + ' ' + f.note + ' ' + f.z).toLowerCase().includes(q)));
    const mealOrder = { 'เช้า': 0, 'กลางวัน': 1, 'เย็น': 2 };
    const plan = list.filter(f => f.day).sort((a, b) => a.day.localeCompare(b.day) || (mealOrder[a.meal] ?? 9) - (mealOrder[b.meal] ?? 9)), other = list.filter(f => !f.day);
    const FN = new Map([...plan, ...other].map((f, i) => [f.id, i + 1]));
    const sec = (title, arr) => arr.length ? `<h3 class="gh">${title} <span>${arr.length}</span></h3><div class="fgrid">${arr.map(f => foodCard(f, FN.get(f.id))).join('')}</div>` : '';
    $('#fout').innerHTML = (sec('ในแผนของเรา', plan) + sec(plan.length ? 'ตัวเลือกเพิ่มเติม' : 'ร้านอาหาร', other)) || '<p class="plain" style="margin-top:24px">ไม่มีรายการตรงกับตัวกรอง</p>';
    TMITEMS.food = () => ({ items: [...plan, ...other].map(f => { const a = resolveLoc(foodAnchor(f)); return { id: f.id, lat: a.lat, lng: a.lng, label: FN.get(f.id), color: f.day ? dayColor(f.day) : '#8a949b', name: f.n, sub: `${f.z}${f.day ? ' · ในแผน ' + f.day + ' · ' + f.meal : ''}`, q: f.q + ' Taiwan', note: AREA_NOTE }; }) });
    refreshTabMap('food', true);
  };
  draw();
  $('#fq').oninput = e => { FF.q = e.target.value; draw(); };
  $('#fz').onchange = e => { FF.z = e.target.value; draw(); };
  $('#fdd').onchange = e => { FF.d = e.target.value; draw(); };
  $$('#fscope button').forEach(b => b.onclick = () => { FF.s = b.dataset.s; renderFood(); });
  $$('#fcats button').forEach(b => b.onclick = () => { FF.c = b.dataset.c; renderFood(); });
}

/* ---------- hotels ---------- */
const HF = { q: '', z: 'all', s: 'all', c: 'all', o: 'default' };
const htName = k => (HTYPES.find(x => x[0] === k) || [k, k])[1];
const hotelCard = (h, n) => `<div class="fd ${h.plan ? 'in' : ''}" data-pick="${h.id}" ${h.plan ? `style="--dc:${dayColor(h.plan.day)}"` : ''}>${areaImg(h.z)}<span class="cn">${n}</span>
  ${h.plan ? `<span class="pb2">ในแผน · ${esc(h.plan.night)}${h.plan.main ? ' · ตัวเลือกหลัก' : ''}</span>` : ''}
  <div class="fn">${esc(h.n)}</div>
  <div class="fz">${esc(h.z)}${h.rating ? ` · คะแนน ${h.rating}/10` : ''}</div>
  <div class="fdish hprice">${esc(h.price)}</div>
  ${h.tags.length ? `<div class="tg">${h.tags.map(k => `<span>${esc(htName(k))}</span>`).join('')}</div>` : ''}
  <p class="fnote">${esc(h.d)}</p>
  <div class="fmeta">${stTag(h.s)}<a href="${gmSearch(h.q)}" target="_blank" rel="noopener">แผนที่</a>${(h.src || []).map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>`).join('')}</div>
</div>`;
function renderHotels() {
  const nPlan = HOTEL_LIST.filter(h => h.plan).length;
  const zOk = (h) => HF.z === 'all' || h.z === HF.z || (HF.z === 'อาลีซาน' && h.z.startsWith('อาลีซาน'));
  $('#tab-hotels').innerHTML = `<div class="hero" style="text-align:left;padding:40px 0 0"><p class="eyebrow">ที่พัก 4 คืน</p><h1>ที่พัก</h1><p class="sub">${HOTEL_LIST.length} ตัวเลือก · <span style="color:var(--ink)">ในแผนของเรา ${nPlan} ตัวเลือก</span></p></div>
    <p class="note">คัดจากเว็บจองห้องและรีวิวที่ค้นเจอ ไม่ใช่การจัดอันดับทางการ <b>ราคาเป็นตัวอย่างคนละวันและคนละสกุลเงิน ไม่ใช่ราคาวันที่ 16–19 ธ.ค. และยังไม่ทราบห้องว่าง</b> ต้องกรอกวันที่เช็คเองก่อนจอง ${stTag('sec')} มีราคา/คะแนนตัวอย่าง ${stTag('no')} ไม่พบราคา</p>
    <div class="filters" style="margin-top:18px"><input id="hq" placeholder="ค้นหาชื่อที่พัก" value="${esc(HF.q)}">
      <select id="hz"><option value="all">ทุกโซน</option>${HZONES.map(z => `<option value="${z}" ${HF.z === z ? 'selected' : ''}>${z}</option>`).join('')}</select>
      <select id="ho"><option value="default" ${HF.o === 'default' ? 'selected' : ''}>เรียงตามแผน</option><option value="price" ${HF.o === 'price' ? 'selected' : ''}>ราคาต่ำ → สูง</option><option value="rating" ${HF.o === 'rating' ? 'selected' : ''}>คะแนนสูง → ต่ำ</option></select></div>
    <div style="margin-top:14px"><div class="seg" id="hscope">${[['all', 'ทั้งหมด'], ['plan', `ในแผน (${nPlan})`], ['none', `ตัวเลือกเพิ่ม (${HOTEL_LIST.length - nPlan})`]].map(([v, tx]) => `<button class="${HF.s === v ? 'on' : ''}" data-s="${v}">${tx}</button>`).join('')}</div></div>
    <div class="cats" id="hcats"><button class="fchip ${HF.c === 'all' ? 'on' : ''}" data-c="all">ทุกประเภท</button>${HTYPES.map(([k, n]) => `<button class="fchip ${HF.c === k ? 'on' : ''}" data-c="${k}">${n} <small>${HOTEL_LIST.filter(h => h.tags.includes(k)).length}</small></button>`).join('')}</div>
    ${mapBlock('hotels')}
    <div id="hout"></div>`;
  const draw = () => {
    const q = HF.q.trim().toLowerCase();
    let list = HOTEL_LIST.filter(h => zOk(h) && (HF.s === 'all' || (HF.s === 'plan' ? h.plan : !h.plan)) && (HF.c === 'all' || h.tags.includes(HF.c)) && (!q || (h.n + ' ' + h.d).toLowerCase().includes(q)));
    const sorter = HF.o === 'price' ? (a, b) => (a.usd ?? 1e9) - (b.usd ?? 1e9) : HF.o === 'rating' ? (a, b) => (b.rating ?? -1) - (a.rating ?? -1) : null;
    const plan = list.filter(h => h.plan), other = list.filter(h => !h.plan);
    if (sorter) { plan.sort(sorter); other.sort(sorter); }
    else other.sort((a, b) => HZONES.indexOf(a.z) - HZONES.indexOf(b.z));
    const HN = new Map([...plan, ...other].map((h, i) => [h.id, i + 1]));
    const sec = (title, arr) => arr.length ? `<h3 class="gh">${title} <span>${arr.length}</span></h3><div class="fgrid">${arr.map(h => hotelCard(h, HN.get(h.id))).join('')}</div>` : '';
    $('#hout').innerHTML = (sec('ในแผนของเรา', plan) + sec(plan.length ? 'ตัวเลือกเพิ่มเติม' : 'ที่พัก', other)) || '<p class="plain" style="margin-top:24px">ไม่มีรายการตรงกับตัวกรอง</p>';
    TMITEMS.hotels = () => ({ items: [...plan, ...other].map(h => { const a = resolveLoc(hotelAnchor(h)); return { id: h.id, lat: a.lat, lng: a.lng, label: HN.get(h.id), color: h.plan ? dayColor(h.plan.day) : '#8a949b', name: h.n, sub: `${h.z}${h.plan ? ' · ในแผน ' + h.plan.night : ''}`, q: h.q + ' Taiwan', note: AREA_NOTE }; }) });
    refreshTabMap('hotels', true);
  };
  draw();
  $('#hq').oninput = e => { HF.q = e.target.value; draw(); };
  $('#hz').onchange = e => { HF.z = e.target.value; draw(); };
  $('#ho').onchange = e => { HF.o = e.target.value; draw(); };
  $$('#hscope button').forEach(b => b.onclick = () => { HF.s = b.dataset.s; renderHotels(); });
  $$('#hcats button').forEach(b => b.onclick = () => { HF.c = b.dataset.c; renderHotels(); });
}

/* ---------- cost ---------- */
const COST_KEY = 'tw2026-cost-v5';
const defaults = { s: { ...D.settings }, items: D.items.map(i => ({ price: i.price, qty: i.qty })) };
let C = store.get(COST_KEY);
if (!C || C.items?.length !== D.items.length) C = JSON.parse(JSON.stringify(defaults));
function calc(i, idx) {
  const s = C.s, ed = C.items[idx];
  const price = i.kind === 'food' ? s.food : ed.price;
  const mult = i.per === 'คน' ? s.people : i.per === 'ห้อง' ? Math.ceil(s.people / 2) : 1;
  return { price, qty: ed.qty, total: price * ed.qty * mult * (i.cur === 'TWD' ? s.rate : 1) };
}
function costTotal() { return D.items.reduce((a, i, idx) => a + calc(i, idx).total, 0) * (1 + C.s.buffer); }
function renderCost() {
  const s = C.s;
  const rows = D.items.map((i, idx) => ({ i, idx, ...calc(i, idx) }));
  const cats = [...new Set(D.items.map(i => i.cat))];
  const sub = rows.reduce((a, r) => a + r.total, 0), total = sub * (1 + s.buffer);
  const flight = rows.find(r => r.i.item.startsWith('ตั๋วเครื่องบิน'));
  const sums = cats.map(c => ({ c, v: rows.filter(r => r.i.cat === c).reduce((a, r) => a + r.total, 0) })).sort((a, b) => b.v - a.v);
  const fld = (k, label, step) => `<div><label>${label}</label><input type="number" inputmode="decimal" step="${step}" data-s="${k}" value="${s[k]}"></div>`;
  $('#tab-cost').innerHTML = `<div class="hero" style="text-align:left;padding:40px 0 8px"><p class="eyebrow">รวมเผื่อ ${Math.round(s.buffer * 100)}% แล้ว</p><h1>งบ</h1><div class="total">฿${thb(total)}</div><p class="sub">2 คน · คนละ ฿${thb(total / s.people)}</p></div>
    <div class="bento">
      <div class="w"><div class="wl">ต่อคน ไม่รวมตั๋วบิน</div><div class="wn" style="font-size:30px">฿${thb((total - flight.total * (1 + s.buffer)) / s.people)}</div></div>
      <div class="w"><div class="wl">ห้องพัก</div><div class="wn" style="font-size:30px">${Math.ceil(s.people / 2)}<small>ห้อง</small></div></div>
      <div class="w c2"><div class="wl">แยกตามหมวด</div>${sums.map(x => `<div class="cat"><div class="wrow" style="padding:0;border:0"><span style="color:var(--ink)">${esc(x.c)}</span><b>฿${thb(x.v)}</b></div><div class="bar1" style="width:${Math.max(1, x.v / sub * 100)}%"></div></div>`).join('')}</div>
    </div>
    ${blk('ตั้งค่า', tile(`<div class="settings">${fld('people', 'จำนวนคน', 1)}${fld('rate', 'บาท ต่อ 1 TWD', 0.01)}${fld('food', 'อาหาร TWD/คน/วัน', 50)}${fld('buffer', 'เผื่อ (0.1 = 10%)', 0.05)}</div>
      <p class="note">แก้ได้ ค่าที่แก้จำไว้ในเบราว์เซอร์เครื่องนี้ · ห้องพักคิด 2 คน/ห้อง</p><button class="btn ghost" id="resetCost">คืนค่าเริ่มต้น</button>`))}
    ${cats.map(c => { const rs = rows.filter(r => r.i.cat === c); return blk(`${esc(c)} <span style="color:var(--muted);font-weight:500">฿${thb(rs.reduce((a, r) => a + r.total, 0))}</span>`, tile(rs.map(r => `<div class="crow ${r.i.item.includes('จองแล้ว') ? 'booked' : ''}"><div class="nm">${esc(r.i.item.replace(' ✅ จองแล้ว', ''))}</div>${r.i.note ? `<div class="small">${esc(r.i.note)}</div>` : ''}
      <div class="edit">${r.i.kind === 'food' ? `<span class="small">${r.price} ${r.i.cur}/คน/วัน</span>` : `<div><label>${r.i.cur} ต่อ${esc(r.i.per)}</label><input type="number" inputmode="decimal" data-i="${r.idx}" data-f="price" value="${r.price}"></div>`}<div><label>จำนวน</label><input type="number" inputmode="decimal" data-i="${r.idx}" data-f="qty" value="${r.qty}"></div><span class="tot">฿${thb(r.total)}</span></div></div>`).join(''))); }).join('')}
    <p class="note" style="margin-top:28px">ราคาส่วนใหญ่เป็นค่าประมาณ ยังไม่ได้เช็คราคาจริง · ตั๋วเครื่องบินจองแล้ว 14,090 บาท (2 คน) · ค่าสัมภาระโหลดยังเป็นค่าสมมติ</p>`;
  $$('#tab-cost input').forEach(inp => inp.onchange = () => {
    const v = parseFloat(inp.value);
    if (!isFinite(v) || v < 0) { renderCost(); return; }
    if (inp.dataset.s) C.s[inp.dataset.s] = inp.dataset.s === 'people' ? Math.max(1, Math.round(v)) : v;
    else C.items[+inp.dataset.i][inp.dataset.f] = v;
    store.set(COST_KEY, C); renderCost();
  });
  $('#resetCost').onclick = () => { C = JSON.parse(JSON.stringify(defaults)); store.set(COST_KEY, null); renderCost(); };
}

/* ---------- todo ---------- */
const TODO_KEY = 'tw2026-todo-v1';
let done = store.get(TODO_KEY) || {};
function renderTodo() {
  const all = TODO.flatMap(g => g.items), n = all.filter(i => done[i.id]).length;
  $('#tab-todo').innerHTML = `<div class="hero" style="text-align:left;padding:40px 0 0"><p class="eyebrow">ทำแล้ว ${n} จาก ${all.length} ข้อ</p><h1>เตรียมตัว</h1><div class="prog"><i style="width:${n / all.length * 100}%"></i></div></div>` +
    TODO.map(g => blk(esc(g.group.replace(/^[^\wก-๙]+/, '')), tile(g.items.map(i => `<label class="todo ${done[i.id] ? 'done' : ''}"><input type="checkbox" data-id="${i.id}" ${done[i.id] ? 'checked' : ''}><span><span class="tt">${esc(i.t)}<span class="due">${esc(i.due)}</span></span>${i.d ? `<span class="dd">${esc(i.d)}</span>` : ''}</span></label>`).join('')))).join('') +
    blk('ใช้ร่วมกัน 2 คน', tile(`<p class="plain" style="font-size:15.5px">กดส่งลิงก์ให้อีกคน เมื่อเปิดลิงก์ เครื่องนั้นจะรวมข้อที่ติ๊กแล้วจากทั้งสองเครื่อง และใช้ค่างบตามลิงก์</p><button class="btn" data-share>ส่งเช็คลิสต์และงบให้อีกคน</button><p class="note" id="shareMsg">ไม่มีเซิร์ฟเวอร์ จึงไม่ซิงค์อัตโนมัติ ต้องส่งลิงก์ใหม่ทุกครั้งที่อยากให้อีกเครื่องอัปเดต</p>`)) +
    blk('ใช้แบบออฟไลน์', tile(`<p class="plain" style="font-size:15.5px">เปิดเว็บนี้ครั้งหนึ่งตอนมีเน็ต หน้าเว็บและรูปจะถูกเก็บไว้ในเครื่อง เปิดได้แม้ไม่มีสัญญาณ (เช่น บนอาลีซาน)</p><ul class="ul"><li>iPhone: เปิดใน Safari → ปุ่มแชร์ → “เพิ่มไปยังหน้าจอโฮม”</li><li>Android: เมนู Chrome → “ติดตั้งแอป” หรือ “เพิ่มลงในหน้าจอหลัก”</li><li>แผนที่ออฟไลน์เก็บเฉพาะส่วนที่เคยเปิดดู ให้เปิดแผนที่แต่ละวันไว้ก่อนเดินทาง</li></ul>${installEvt ? '<button class="btn" data-install>ติดตั้งเป็นแอป</button>' : ''}`)) +
    '<p class="note" style="margin-top:28px">ติ๊กเมื่อทำเสร็จ · จำไว้ในเบราว์เซอร์เครื่องนี้</p>';
  $$('#tab-todo input').forEach(c => c.onchange = () => { done[c.dataset.id] = c.checked; store.set(TODO_KEY, done); renderTodo(); });
  $$('#tab-todo [data-share]').forEach(b => b.onclick = () => shareState({ todo: done, cost: C }).then(r => { const m = $('#shareMsg'); if (m && r === 'copied') m.textContent = 'คัดลอกลิงก์แล้ว ส่งให้อีกคนทางแชทได้เลย'; }));
  $$('#tab-todo [data-install]').forEach(b => b.onclick = () => { installEvt.prompt(); installEvt = null; });
}

/* ---------- share link import ---------- */
const shared = readShared();
if (shared) {
  history.replaceState(null, '', location.pathname + location.search + '#todo');
  if (window.confirm('นำเข้าเช็คลิสต์และงบจากลิงก์ที่ส่งมา?\nข้อที่ติ๊กแล้วจะรวมกับของเครื่องนี้ ส่วนค่างบจะใช้ตามลิงก์')) {
    if (shared.todo && typeof shared.todo === 'object') { Object.entries(shared.todo).forEach(([k, v]) => { if (v === true) done[k] = true; }); store.set(TODO_KEY, done); }
    if (shared.cost && shared.cost.s && shared.cost.items?.length === D.items.length) { C = shared.cost; store.set(COST_KEY, C); }
  }
}

/* ---------- offline (PWA) ---------- */
let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (state.tab === 'todo') renderTodo(); });
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(() => navigator.serviceWorker.ready).then(reg => {
      const own = performance.getEntriesByType('resource').map(e => e.name).filter(u => u.startsWith(location.origin));
      const imgs = P.filter(p => p.img).map(p => new URL(img(p), location.href).href);
      reg.active?.postMessage({ cache: [...new Set([...own, ...imgs])] });
    }).catch(() => {});
  });
}

/* ---------- boot ---------- */
parseHash();
renderPlaces(); renderFood(); renderHotels(); renderTransport(); renderCost(); renderTodo();
window.addEventListener('hashchange', () => { parseHash(); show(); });
show();
