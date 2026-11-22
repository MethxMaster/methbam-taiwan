import './style.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import D from './trip.json';
import { TODO } from './todo.js';
import { DAY_INFO, COST_DAYS, LOCS, HOTELS, HOTEL_FOR_DAY } from './days.js';

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
};
const thb = n => Math.round(n).toLocaleString('th-TH');
const fmtH = h => (Math.round(h * 10) / 10).toFixed(1);
const enc = encodeURIComponent;
const img = p => (p.img ? import.meta.env.BASE_URL + p.img : null);
const P = D.places, DAYS = D.days, LEGS = D.legs;
const byCode = Object.fromEntries(P.map(p => [p.code, p]));
const AIRPORT = { lat: 25.0777, lng: 121.2328 };
const ORDER = { D1: [], D2: ['E2', 'E1', 'F1'], D3: ['F2', 'B1'], D4: ['C1', 'C2', 'D1'], D5: ['A2', 'A1'] };
const GROUP_SHORT = { A: 'ไทเป', B: 'อูไหล', C: 'จีหลง', D: 'จิ่วเฟิ่น', E: 'อาลีซาน', F: 'SML', G: 'ทางผ่าน' };
const gk = p => p.code.replace(/\d+/g, '');
const dayDate = d => new Date(d.date + 'T00:00:00');
const dayLabel = d => `${d.wd} ${dayDate(d).getDate()} ธ.ค.`;
const WD = { 'พุธ': 'พุธ', 'พฤหัสบดี': 'พฤ.', 'ศุกร์': 'ศุกร์', 'เสาร์': 'เสาร์', 'อาทิตย์': 'อา.' };
const gmSearch = q => 'https://www.google.com/maps/search/?api=1&query=' + enc(q);
const gmDir = (a, b) => `https://www.google.com/maps/dir/?api=1&origin=${enc(a)}&destination=${enc(b)}&travelmode=transit`;
function resolveLoc(c) {
  if (!c) return null;
  if (byCode[c]) { const p = byCode[c]; return { key: c, name: p.name, lat: p.lat, lng: p.lng, q: p.search + ' Taiwan' }; }
  return LOCS[c] ? { key: c, ...LOCS[c] } : null;
}
const seg = (items, cur, attr) => `<div class="seg">${items.map(([v, t, s]) => `<button class="${v === cur ? 'on' : ''}" ${attr}="${v}">${t}${s ? `<small>${s}</small>` : ''}</button>`).join('')}</div>`;

/* ---------- countdown ---------- */
const TRIP_START = new Date('2026-12-16T00:00:00+08:00');
const TRIP_END = new Date('2026-12-21T00:00:00+08:00');
(() => {
  const now = new Date(), el = $('#countdown');
  el.textContent = now < TRIP_START ? `อีก ${Math.ceil((TRIP_START - now) / 864e5)} วัน` : now < TRIP_END ? `วันที่ ${Math.floor((now - TRIP_START) / 864e5) + 1} ของทริป` : 'จบทริปแล้ว';
})();

/* ---------- state / routing ---------- */
const TABS = ['plan', 'map', 'places', 'cost', 'todo'];
let state = { tab: 'plan', day: 'all' };
(() => {
  const now = new Date();
  if (now >= TRIP_START && now < TRIP_END) state.day = DAYS[Math.min(4, Math.floor((now - TRIP_START) / 864e5))].day;
})();
function parseHash() {
  const [t, d] = (location.hash || '').slice(1).split('/');
  if (TABS.includes(t)) state.tab = t;
  if (t === 'plan') state.day = DAYS.some(x => x.day === d) ? d : 'all';
}
function go(tab, day) {
  state.tab = tab; if (day) state.day = day;
  history.replaceState(null, '', `#${tab}${tab === 'plan' && state.day !== 'all' ? '/' + state.day : ''}`);
  show();
}
function show() {
  $$('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === state.tab));
  TABS.forEach(t => $('#tab-' + t).classList.toggle('on', t === state.tab));
  if (state.tab === 'plan') renderPlan();
  if (state.tab === 'map') { initMap(); setTimeout(() => { map.invalidateSize(); drawMap(); }, 30); }
  window.scrollTo({ top: 0 });
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
        <dt>ความน่าไป</dt><dd>${esc(p.rec)}</dd>
        <dt>หมายเหตุ</dt><dd>${esc(p.note)}</dd>
      </dl>
      <div class="links"><a href="${gmSearch(p.search + ' Taiwan')}" target="_blank" rel="noopener">เปิดใน Google Maps</a>${p.imgFile ? `<a href="https://commons.wikimedia.org/wiki/File:${enc(p.imgFile)}" target="_blank" rel="noopener">เครดิตรูป</a>` : ''}</div>
    </div>`;
  $('#sheet').hidden = false;
}
$('#sheet').addEventListener('click', e => { if (e.target.closest('[data-close]')) $('#sheet').hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#sheet').hidden = true; });
document.addEventListener('click', e => { const el = e.target.closest('[data-place]'); if (el) openPlace(el.dataset.place); });

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
  D4: 'ไทเป → จีหลง → จิ่วเฟิ่น → ไทเป', D5: 'ซีเหมินติง → สนามบิน',
};
function dayCosts(day) {
  const rows = [];
  D.items.forEach((i, idx) => {
    const m = COST_DAYS.find(c => i.item.includes(c.m));
    if (m && m.days.includes(day)) rows.push({ name: i.item.replace(/\s*\(.*$/, '').replace(/ ✅.*$/, ''), v: calc(i, idx).total / m.days.length });
  });
  return rows;
}
const subTabs = cur => seg([['all', 'ภาพรวม'], ...DAYS.map(d => [d.day, d.day, `${WD[d.wd] || d.wd} ${dayDate(d).getDate()}`])], cur, 'data-day');
function bindDay(root) {
  $$('[data-day]', root).forEach(b => b.onclick = () => { go('plan', b.dataset.day); });
  $$('[data-goto]', root).forEach(b => b.onclick = () => go(b.dataset.goto));
}
let miniMap = null;
const pinIcon = (label, cls = '') => L.divIcon({ className: '', iconSize: null, html: `<div class="pin ${cls}">${label}</div>` });
const baseTiles = m => L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles &copy; Esri' }).addTo(m);
const lineStyle = { color: '#1b1b19', weight: 2, opacity: .7, dashArray: '5 7' };
function drawDayMap(el, stops) {
  const m = L.map(el, { scrollWheelZoom: false, dragging: !L.Browser.mobile });
  baseTiles(m);
  const pts = stops.map(s => [s.lat, s.lng]);
  stops.forEach(s => L.marker([s.lat, s.lng], { icon: pinIcon(s.mark, s.sq ? 'sq' : '') }).bindTooltip(s.name).addTo(m));
  if (pts.length > 1) L.polyline(pts, lineStyle).addTo(m);
  if (pts.length) m.fitBounds(pts, { padding: [36, 36], maxZoom: 14 }); else m.setView([24.3, 121.1], 8);
  miniMap = m; setTimeout(() => m.invalidateSize(), 60);
}
function renderPlan() {
  if (miniMap) { miniMap.remove(); miniMap = null; }
  if (state.day === 'all') renderOverview(); else renderDay();
}
function renderOverview() {
  const done = store.get('tw2026-todo-v1') || {};
  const urgent = TODO.flatMap(g => g.items).filter(x => x.due === 'ทันที' && !done[x.id]);
  $('#tab-plan').innerHTML = subTabs('all') + `
    <h1>ไต้หวัน 5 วัน 4 คืน</h1>
    <p class="lead">16–20 ธ.ค. 2569 · 2 คน · ไม่เช่ารถ ใช้ HSR บัส MRT</p>
    <dl class="kv">
      <dt>ขาไป</dt><dd>VZ566 · BKK 01:50 → TPE 06:30 (T1)</dd>
      <dt>ขากลับ</dt><dd>VZ569 · TPE 19:50 → BKK 22:50 (T1)</dd>
      <dt>ที่พัก</dt><dd>อาลีซาน 16 · SML 17 · ไทเป 18–19</dd>
      <dt>งบรวม</dt><dd>~฿${thb(costTotal())} สำหรับ 2 คน (ตั๋วเครื่องบินจองแล้ว)</dd>
    </dl>
    <h2>เส้นทาง</h2>
    <div id="ovmap" class="mini"></div>
    <p class="sub-note">เส้นประคือเส้นทาง H = ที่พัก A = สนามบิน · ตำแหน่งโดยประมาณ</p>
    ${urgent.length ? `<h2>ต้องทำก่อน</h2>${urgent.map(x => `<div class="item"><b>${esc(x.t)}</b><div class="small">${esc(x.d)}</div></div>`).join('')}<button class="btn" data-goto="todo">เปิดรายการเตรียมตัว</button>` : ''}
    <h2>แต่ละวัน</h2>
    <div class="rows">${DAYS.map(d => {
      const info = DAY_INFO[d.day], h = HOTELS[HOTEL_FOR_DAY[d.day]];
      const cost = dayCosts(d.day).reduce((s, r) => s + r.v, 0);
      return `<button class="row-link" data-day="${d.day}"><span class="rk">${d.day}</span><span class="rb"><b>${esc(dayLabel(d))} · ${esc(OVERVIEW[d.day])}</b><span>${esc(info.headline)}</span><span class="meta">${d.day === 'D5' ? 'บินกลับ 19:50' : 'นอน ' + esc(h.title.split(' · ')[0])} · ${info.book.length ? `ต้องจอง ${info.book.length} รายการ` : 'ไม่ต้องจองล่วงหน้า'} · ~฿${thb(cost)}</span></span></button>`; }).join('')}</div>
    <h2>ต้องเช็คก่อนจอง</h2>
    <ul class="ul">${NOTES.map(n => `<li>${esc(n)}</li>`).join('')}</ul>`;
  bindDay($('#tab-plan'));
  const el = $('#ovmap'); if (!el) return;
  const m = L.map(el, { scrollWheelZoom: false, dragging: !L.Browser.mobile });
  baseTiles(m);
  const R = k => resolveLoc(k);
  const segs = [['TPE', 'HSR_TY', 'HSR_CY', 'ALI_STN'], ['ALI_STN', 'E2', 'SHUISHE', 'HOTEL_SML'], ['HOTEL_SML', 'HSR_TC', 'TPE_MAIN', 'B1', 'HOTEL_TPE'], ['HOTEL_TPE', 'KEELUNG_STN', 'D1', 'HOTEL_TPE'], ['HOTEL_TPE', 'A2', 'A1', 'TPE']];
  const pts = [];
  segs.forEach(ks => { const ll = ks.map(R).filter(Boolean).map(s => [s.lat, s.lng]); L.polyline(ll, lineStyle).addTo(m); pts.push(...ll); });
  [['HOTEL_ALI', 'H', true], ['HOTEL_SML', 'H', true], ['HOTEL_TPE', 'H', true], ['TPE', 'A', true]].forEach(([k, mk, sq]) => { const s = R(k); L.marker([s.lat, s.lng], { icon: pinIcon(mk, 'sq') }).bindTooltip(s.name).addTo(m); });
  m.fitBounds(pts, { padding: [30, 30] });
  miniMap = m; setTimeout(() => m.invalidateSize(), 60);
}
function hotelBlock(hk, dayId) {
  const h = HOTELS[hk], l = resolveLoc(h.loc);
  return `<div class="small"><b style="color:var(--ink)">${esc(h.title)}</b>${(dayId === 'D4' || dayId === 'D5') ? ' · ที่พักเดียวกับคืนที่แล้ว' : ''}</div>
    <p class="plain" style="margin:6px 0 14px">${esc(h.why)}</p>
    ${h.picks.map((p, k) => `<div class="item"><b>${k + 1}. ${esc(p.n)}</b><div class="small">${esc(p.d)}</div><div class="small" style="color:var(--ink)">ราคา: ${esc(p.price)}</div><div class="small"><a href="${gmSearch(p.q)}" target="_blank" rel="noopener">ดูในแผนที่</a></div></div>`).join('')}
    <p class="sub-note">คัดจากเว็บจองห้องและรีวิว ไม่ใช่การจัดอันดับทางการ ราคาเป็นตัวอย่างคนละวัน ไม่ใช่ราคาวันที่ไป ต้องกรอกวันที่เช็คเอง · <a href="${gmSearch(l.q)}" target="_blank" rel="noopener">ดูย่านนี้ในแผนที่</a></p>`;
}
function renderDay() {
  const d = DAYS.find(x => x.day === state.day), i = DAYS.indexOf(d), info = DAY_INFO[d.day];
  const places = (ORDER[d.day] || []).map(c => byCode[c]);
  const legs = LEGS.filter(l => l.day === d.day);
  const visit = places.reduce((s, p) => s + p.hours, 0), travel = legs.reduce((s, l) => s + l.min, 0) / 60;
  const left = d.avail - visit - travel;
  const status = left < 0 ? 'แน่นเกิน' : left < 1.5 ? 'ตึง' : 'โอเค';
  const costs = dayCosts(d.day), ctot = costs.reduce((s, r) => s + r.v, 0);
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
  $('#tab-plan').innerHTML = subTabs(d.day) + `
    <h1>${esc(d.day)} · ${esc(dayLabel(d))}</h1>
    <p class="lead">${esc(OVERVIEW[d.day])}</p>
    <p style="margin-top:14px">${esc(info.headline)}</p>
    <dl class="kv">
      <dt>นอน</dt><dd>${esc(d.sleep)}</dd>
      <dt>เวลา</dt><dd>เที่ยว ${fmtH(visit)} ชม. · เดินทาง ${fmtH(travel)} ชม. จากที่มี ${d.avail} ชม. (${status})</dd>
      <dt>งบวันนี้</dt><dd>~฿${thb(ctot)} สำหรับ 2 คน ไม่รวมเผื่อ</dd>
    </dl>
    <h2>แผนที่</h2>
    <div id="daymap" class="mini"></div>
    <div class="stops">${stops.map(s => `<a href="${gmSearch(s.q)}" target="_blank" rel="noopener"><b>${s.mark}</b>${esc(s.name)}</a>`).join('')}</div>
    <p class="sub-note">ตำแหน่งโดยประมาณ กดชื่อเพื่อเปิด Google Maps</p>
    <h2>ตารางเวลา <span class="s">· เวลาเป็นค่าประมาณ</span></h2>
    <div>${steps.map(s => `<div class="sr k-${s.k}"><div class="st">${esc(s.t)}</div><div><div class="stt">${esc(s.title)}</div>${s.d ? `<div class="sd">${esc(s.d)}</div>` : ''}
      ${(s.dur || s.cost || s.l) ? `<div class="meta">${[s.dur ? esc(s.dur) : '', s.cost ? esc(s.cost) : '', s.l ? `<a href="${gmSearch(s.l.q)}" target="_blank" rel="noopener">แผนที่ ${s.n}</a>` : '', s.l && s.from ? `<a href="${gmDir(s.from.q, s.l.q)}" target="_blank" rel="noopener">เส้นทางจากจุดก่อนหน้า</a>` : ''].filter(Boolean).join('<i>·</i>')}</div>` : ''}
      ${s.tip ? `<div class="tip">${esc(s.tip)}</div>` : ''}</div></div>`).join('')}</div>
    <p class="sub-note">${esc(d.note)}</p>
    <h2>ที่พักแนะนำ</h2>${hotelBlock(HOTEL_FOR_DAY[d.day], d.day)}
    ${info.book.length ? `<h2>ต้องจองหรือซื้อ</h2>${info.book.map(b => `<div class="item"><b>${esc(b.t)}</b><span class="due">${esc(b.due)}</span><div class="small">${esc(b.d)}</div></div>`).join('')}<button class="btn" data-goto="todo">เปิดรายการเตรียมตัว</button>` : ''}
    ${places.length ? `<h2>สถานที่</h2><div class="strip">${places.map(p => photo(p)).join('')}</div>` : ''}
    <h2>อากาศและการเตรียมตัว</h2>
    <dl class="kv" style="margin-top:0"><dt>อากาศ</dt><dd>${esc(d.wx)}</dd><dt>เตรียม</dt><dd>${esc(d.pack)}</dd><dt>ถ้าฝนตก</dt><dd>${esc(d.rain)}</dd></dl>
    <h2>แผนสำรอง</h2><ul class="ul">${info.backup.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
    ${info.food.length ? `<h2>ของกินที่น่าลอง</h2><p class="plain">${info.food.map(esc).join(' · ')}</p><p class="sub-note">ข้อแนะนำทั่วไป ไม่ได้เช็คร้านหรือจองไว้</p>` : ''}
    <h2>การเดินทาง</h2>
    ${legs.map(l => `<div class="item"><div style="display:flex;justify-content:space-between;gap:12px"><b>${esc(l.frm)} → ${esc(l.to)}</b><span class="small" style="white-space:nowrap">${l.min >= 60 ? fmtH(l.min / 60) + ' ชม.' : l.min + ' น.'}</span></div><div class="small">${esc(l.mode)}${l.km ? ` · ${l.km} กม.` : ''}${l.note ? ` · ${esc(l.note)}` : ''}</div></div>`).join('')}
    <h2>ค่าใช้จ่ายวันนี้</h2>
    ${costs.map(r => `<div class="line"><span>${esc(r.name)}</span><span>฿${thb(r.v)}</span></div>`).join('') || '<p class="plain">ไม่มีรายการ</p>'}
    <div class="line" style="border-top:1px solid var(--line);margin-top:4px"><b>รวม</b><b>฿${thb(ctot)}</b></div>
    <p class="sub-note">ตั๋วเครื่องบิน สัมภาระ eSIM ประกัน ไม่ผูกกับวัน · แก้ราคาได้ที่แท็บงบ</p>
    <div class="pn">${i > 0 ? `<button data-day="${DAYS[i - 1].day}">← ${DAYS[i - 1].day}</button>` : '<button data-day="all">← ภาพรวม</button>'}${i < DAYS.length - 1 ? `<button data-day="${DAYS[i + 1].day}">${DAYS[i + 1].day} →</button>` : '<button data-day="all">ภาพรวม →</button>'}</div>`;
  bindDay($('#tab-plan'));
  drawDayMap($('#daymap'), stops);
}
function photo(p) {
  const src = img(p);
  return `<button class="ph" data-place="${p.code}">${src ? `<img src="${esc(src)}" alt="" loading="lazy">` : '<div class="noimg">ยังไม่มีรูป</div>'}<div class="n">${esc(p.name)}</div><div class="s">${esc(p.hours)} ชม. · ${esc(p.best)}</div></button>`;
}

/* ---------- map tab ---------- */
let map, layer, mapFilter = 'plan';
function initMap() {
  if (map) return;
  map = L.map('map').setView([24.3, 121.1], 8);
  baseTiles(map);
  layer = L.layerGroup().addTo(map);
  const opts = [['plan', 'แผนของเรา'], ...DAYS.map(d => [d.day, d.day]), ['all', 'ทุกสถานที่']];
  const bar = $('#mapbar');
  const paint = () => { bar.innerHTML = opts.map(([v, t]) => `<button class="${v === mapFilter ? 'on' : ''}" data-f="${v}">${t}</button>`).join(''); $$('#mapbar button').forEach(b => b.onclick = () => { mapFilter = b.dataset.f; paint(); drawMap(); }); };
  paint();
}
function drawMap() {
  if (!map) return;
  layer.clearLayers();
  const pts = [];
  const days = mapFilter === 'plan' || mapFilter === 'all' ? DAYS.map(d => d.day) : [mapFilter];
  days.forEach(dd => (ORDER[dd] || []).forEach((c, k) => {
    const p = byCode[c];
    L.marker([p.lat, p.lng], { icon: pinIcon(`${dd.slice(1)}.${k + 1}`) }).bindTooltip(p.name).on('click', () => openPlace(c)).addTo(layer); pts.push([p.lat, p.lng]);
  }));
  L.marker([AIRPORT.lat, AIRPORT.lng], { icon: pinIcon('A', 'sq') }).bindTooltip('สนามบินเถาหยวน (TPE)').addTo(layer);
  if (mapFilter === 'all') P.filter(p => !p.day).forEach(p => { L.marker([p.lat, p.lng], { icon: pinIcon(p.code, 's') }).bindTooltip(p.name).on('click', () => openPlace(p.code)).addTo(layer); pts.push([p.lat, p.lng]); });
  if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 13 });
}

/* ---------- places ---------- */
const F = { q: '', g: 'all', d: 'all' };
function renderPlaces() {
  $('#tab-places').innerHTML = `<h1>สถานที่</h1><p class="lead">${P.length} แห่ง · กดรูปเพื่อดูรายละเอียด</p>
    <div class="filters" style="margin-top:18px"><input id="q" placeholder="ค้นหา เช่น น้ำพุร้อน ตลาดกลางคืน" value="${esc(F.q)}">
      <select id="fg"><option value="all">ทุกโซน</option>${Object.entries(GROUP_SHORT).map(([k, v]) => `<option value="${k}" ${F.g === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <select id="fd"><option value="all">ทุกวัน</option>${DAYS.map(d => `<option value="${d.day}" ${F.d === d.day ? 'selected' : ''}>${d.day}</option>`).join('')}<option value="none" ${F.d === 'none' ? 'selected' : ''}>ยังไม่วาง</option></select></div>
    <div class="small" id="pcount" style="margin-top:14px"></div><div class="grid" id="pgrid"></div>`;
  const draw = () => {
    const q = F.q.trim().toLowerCase();
    const list = P.filter(p => (F.g === 'all' || gk(p) === F.g) && (F.d === 'all' || (F.d === 'none' ? !p.day : p.day === F.d)) && (!q || (p.name + ' ' + p.tags + ' ' + p.code).toLowerCase().includes(q)));
    $('#pcount').textContent = `${list.length} แห่ง`;
    $('#pgrid').innerHTML = list.map(p => { const src = img(p); return `<button class="ph" data-place="${p.code}">${src ? `<img src="${esc(src)}" alt="" loading="lazy">` : '<div class="noimg">ยังไม่มีรูป</div>'}<div class="n">${esc(p.name)}</div><div class="s">${esc(GROUP_SHORT[gk(p)])} · ${esc(p.hours)} ชม.${p.day ? ' · ' + p.day : ''}</div></button>`; }).join('') || '<p class="plain">ไม่มีสถานที่ตรงกับตัวกรอง</p>';
  };
  draw();
  $('#q').oninput = e => { F.q = e.target.value; draw(); };
  $('#fg').onchange = e => { F.g = e.target.value; draw(); };
  $('#fd').onchange = e => { F.d = e.target.value; draw(); };
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
  $('#tab-cost').innerHTML = `<h1>งบ</h1><p class="lead">รวมเผื่อ ${Math.round(s.buffer * 100)}% แล้ว</p>
    <div class="total">฿${thb(total)}</div>
    <div style="margin-top:12px"><div class="line"><span>ต่อคน</span><b>฿${thb(total / s.people)}</b></div>
    <div class="line"><span>ต่อคน ไม่รวมตั๋วเครื่องบิน</span><b>฿${thb((total - flight.total * (1 + s.buffer)) / s.people)}</b></div>
    <div class="line"><span>ห้องพัก</span><b>${Math.ceil(s.people / 2)} ห้อง</b></div></div>
    <h2>แยกตามหมวด</h2>
    ${sums.map(x => `<div style="margin:10px 0"><div class="line" style="padding:0"><span>${esc(x.c)}</span><b>฿${thb(x.v)}</b></div><div class="bar1" style="width:${Math.max(1, x.v / sub * 100)}%"></div></div>`).join('')}
    <h2>ตั้งค่า</h2>
    <div class="settings">${fld('people', 'จำนวนคน', 1)}${fld('rate', 'บาท ต่อ 1 TWD', 0.01)}${fld('food', 'อาหาร TWD/คน/วัน', 50)}${fld('buffer', 'เผื่อ (0.1 = 10%)', 0.05)}</div>
    <p class="sub-note">ช่องสีครีมแก้ได้ ค่าที่แก้จำไว้ในเบราว์เซอร์เครื่องนี้ · ห้องพักคิด 2 คน/ห้อง</p>
    <button class="btn" id="resetCost">คืนค่าเริ่มต้น</button>
    ${cats.map(c => { const rs = rows.filter(r => r.i.cat === c); return `<h2>${esc(c)} <span class="s">· ฿${thb(rs.reduce((a, r) => a + r.total, 0))}</span></h2>${rs.map(r => `<div class="crow ${r.i.item.includes('จองแล้ว') ? 'booked' : ''}"><div class="nm">${esc(r.i.item.replace(' ✅ จองแล้ว', ''))}</div>${r.i.note ? `<div class="small">${esc(r.i.note)}</div>` : ''}
      <div class="edit">${r.i.kind === 'food' ? `<span class="small">${r.price} ${r.i.cur}/คน/วัน</span>` : `<div><label>${r.i.cur} ต่อ${esc(r.i.per)}</label><input type="number" inputmode="decimal" data-i="${r.idx}" data-f="price" value="${r.price}"></div>`}<div><label>จำนวน</label><input type="number" inputmode="decimal" data-i="${r.idx}" data-f="qty" value="${r.qty}"></div><span class="tot">฿${thb(r.total)}</span></div></div>`).join('')}`; }).join('')}
    <p class="sub-note" style="margin-top:20px">ราคาส่วนใหญ่เป็นค่าประมาณ ยังไม่ได้เช็คราคาจริง · ตั๋วเครื่องบินจองแล้ว 14,090 บาท (2 คน) · ค่าสัมภาระโหลดยังเป็นค่าสมมติ</p>`;
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
  $('#tab-todo').innerHTML = `<h1>เตรียมตัว</h1><p class="lead">ทำแล้ว ${n} จาก ${all.length} ข้อ</p><div class="prog"><i style="width:${n / all.length * 100}%"></i></div>` +
    TODO.map(g => `<h2>${esc(g.group.replace(/^[^\wก-๙]+/, ''))}</h2>${g.items.map(i => `<label class="todo ${done[i.id] ? 'done' : ''}"><input type="checkbox" data-id="${i.id}" ${done[i.id] ? 'checked' : ''}><span><span class="tt">${esc(i.t)}<span class="due">${esc(i.due)}</span></span>${i.d ? `<span class="dd">${esc(i.d)}</span>` : ''}</span></label>`).join('')}`).join('') +
    '<p class="sub-note">ติ๊กเมื่อทำเสร็จ · จำไว้ในเบราว์เซอร์เครื่องนี้</p>';
  $$('#tab-todo input').forEach(c => c.onchange = () => { done[c.dataset.id] = c.checked; store.set(TODO_KEY, done); renderTodo(); });
}

/* ---------- boot ---------- */
parseHash();
renderPlaces(); renderCost(); renderTodo();
window.addEventListener('hashchange', () => { parseHash(); show(); });
show();
