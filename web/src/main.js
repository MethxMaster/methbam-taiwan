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
const img = p => (p.img ? import.meta.env.BASE_URL + p.img : null);
const P = D.places, DAYS = D.days, LEGS = D.legs;
const byCode = Object.fromEntries(P.map(p => [p.code, p]));
const DC = { D1: '#0e7490', D2: '#7c3aed', D3: '#db2777', D4: '#ea580c', D5: '#16a34a' };
const dayColor = d => DC[d] || '#8a949b';
const AIRPORT = { lat: 25.0777, lng: 121.2328 };
const ORDER = { D1: [], D2: ['E2', 'E1', 'F1'], D3: ['F2', 'B1'], D4: ['C1', 'C2', 'D1'], D5: ['A2', 'A1'] };
const ROUTE = { D1: ['AIR', 'E1'], D2: ['E1', 'F1'], D3: ['F1', 'A1', 'B1'], D4: ['A1', 'C1', 'D1', 'A1'], D5: ['A1', 'AIR'] };
const GROUP_SHORT = { A: 'ไทเป', B: 'อูไหล', C: 'จีหลง', D: 'จิ่วเฟิ่น', E: 'อาลีซาน', F: 'SML', G: 'ทางผ่าน' };
const gk = p => p.code.replace(/\d+/g, '');
const dayLabel = d => `${d.wd} ${new Date(d.date + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`;
const WD = { 'พุธ': 'พุธ', 'พฤหัสบดี': 'พฤ.', 'ศุกร์': 'ศุกร์', 'เสาร์': 'เสาร์', 'อาทิตย์': 'อา.' };
const dayShort = d => WD[d.wd] || d.wd;
const modeIcon = m => /HSR/.test(m) ? '🚄' : /ตม|รอ/.test(m) ? '🛂' : /รถไฟป่า/.test(m) ? '🚂' : /Airport MRT|MRT/.test(m) ? '🚇' : /บัส|รถเมล์/.test(m) ? '🚌' : /รถไฟ/.test(m) ? '🚆' : /แท็กซี่/.test(m) ? '🚕' : '🚶';

/* ---------- header countdown ---------- */
const TRIP_START = new Date('2026-12-16T00:00:00+08:00');
const TRIP_END = new Date('2026-12-21T00:00:00+08:00');
function countdown() {
  const now = new Date();
  const el = $('#countdown');
  if (now < TRIP_START) el.textContent = `อีก ${Math.ceil((TRIP_START - now) / 864e5)} วันออกเดินทาง`;
  else if (now < TRIP_END) el.textContent = `วันที่ ${Math.floor((now - TRIP_START) / 864e5) + 1} ของทริป`;
  else el.textContent = 'จบทริปแล้ว';
}
countdown();

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

/* ---------- place detail sheet ---------- */
function openPlace(code) {
  const p = byCode[code]; if (!p) return;
  const src = img(p);
  const gm = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.search + ' Taiwan');
  $('#sheetBox').innerHTML = `<button class="sheet-x" data-close aria-label="ปิด">✕</button>
    ${src ? `<img src="${esc(src)}" alt="${esc(p.name)}">` : '<div class="noimg">ยังไม่มีรูป</div>'}
    <div class="sb">
      <div class="badge" style="background:${dayColor(p.day)};color:#fff">${p.day ? esc(p.day) : 'ยังไม่วางในแผน'}</div>
      <h3 style="margin-top:8px">${esc(p.name)}</h3>
      <div class="small">${esc(p.code)} · ${esc(GROUP_SHORT[gk(p)])} · ${esc(p.tags)}</div>
      <div class="facts"><span>⏱ ${esc(p.hours)} ชม.</span><span>🕒 ${esc(p.best)}</span>${p.drive ? `<span>↔ ห่างจุดหลัก ~${esc(p.drive)} นาที</span>` : ''}<span>${esc(p.rec)}</span></div>
      <p>${esc(p.note)}</p>
      <div class="links"><a href="${gm}" target="_blank" rel="noopener">เปิดใน Google Maps ↗</a>${p.imgFile ? `<a class="alt" href="https://commons.wikimedia.org/wiki/File:${encodeURIComponent(p.imgFile)}" target="_blank" rel="noopener">เครดิตรูป ↗</a>` : ''}</div>
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
  'ที่พักอาลีซาน (คืน 16) และ SML (คืน 17) จองก่อน แบบยกเลิกฟรี',
  'อูไหลอยู่เย็นวันศุกร์ ถ้าถึงไทเปช้ากว่า ~15:30 ให้เลื่อนไปเช้าวันอาทิตย์ (ออก ~08:00 และถึงสนามบินไม่เกิน ~17:00)',
  'ยังไม่มีพยากรณ์จริงของ 16–20 ธ.ค. อากาศในแต่ละวันเป็นค่าเฉลี่ยเดือน ธ.ค. · เช็คพยากรณ์ (CWA / Windy) อีกครั้ง ~11–13 ธ.ค. · เช็คล่าสุด: ยังไม่ได้เช็ค',
];
function dayCosts(day) {
  const rows = [];
  D.items.forEach((i, idx) => {
    const m = COST_DAYS.find(c => i.item.includes(c.m));
    if (m && m.days.includes(day)) rows.push({ name: i.item.replace(/\s*\(.*$/, '').replace(/ ✅.*$/, ''), v: calc(i, idx).total / m.days.length });
  });
  return rows;
}
function subTabs(cur) {
  const items = [['all', '📋', 'ภาพรวม', ''], ...DAYS.map(d => [d.day, '', d.day, `${dayShort(d)} ${new Date(d.date + 'T00:00:00').getDate()}`])];
  return `<div class="days sub">${items.map(([v, ic, a, b]) => `<button class="dp ${v === cur ? 'on' : ''}" data-day="${v}" style="${v === cur ? `background:${v === 'all' ? 'var(--brand)' : dayColor(v)}` : ''}"><b>${ic ? ic + ' ' : ''}${a}</b>${b ? `<span>${b}</span>` : '<span>ทั้งทริป</span>'}</button>`).join('')}</div>`;
}
function bindDay(root) {
  $$('[data-day]', root).forEach(b => b.onclick = () => { go('plan', b.dataset.day); window.scrollTo({ top: 0 }); });
  $$('[data-goto]', root).forEach(b => b.onclick = () => go(b.dataset.goto));
}
const enc = encodeURIComponent;
const gmSearch = q => 'https://www.google.com/maps/search/?api=1&query=' + enc(q);
const gmDir = (from, to) => `https://www.google.com/maps/dir/?api=1&origin=${enc(from)}&destination=${enc(to)}&travelmode=transit`;
function resolveLoc(c) {
  if (!c) return null;
  if (byCode[c]) { const p = byCode[c]; return { key: c, name: p.name, lat: p.lat, lng: p.lng, q: p.search + ' Taiwan' }; }
  return LOCS[c] ? { key: c, ...LOCS[c] } : null;
}
const OVERVIEW = {
  D1: { route: 'เถาหยวน → เจียอี้ → อาลีซาน', how: '🚇 MRT · 🚄 HSR · 🚌 บัส' },
  D2: { route: 'อาลีซาน (จู้ซาน) → SML', how: '🚂 รถไฟป่า · 🚌 บัส' },
  D3: { route: 'SML → ไถจง → ไทเป → อูไหล', how: '🚌 บัส · 🚄 HSR · 🚇 MRT' },
  D4: { route: 'ไทเป → จีหลง → จิ่วเฟิ่น → ไทเป', how: '🚆 รถไฟ · 🚌 บัส' },
  D5: { route: 'วัดหลงซาน/ซีเหมินติง → สนามบิน', how: '🚇 MRT' },
};
let miniMap = null;
function drawMiniMap(el, stops, color) {
  if (miniMap) { miniMap.remove(); miniMap = null; }
  const m = L.map(el, { scrollWheelZoom: false, dragging: !L.Browser.mobile, zoomControl: true });
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles &copy; Esri' }).addTo(m);
  const pts = [];
  stops.forEach(s => {
    const icon = s.icon || String(s.n);
    L.marker([s.lat, s.lng], { icon: pinIcon(icon, s.color || color, false) }).bindTooltip(`${s.icon ? '' : s.n + '. '}${s.name}`).addTo(m);
    pts.push([s.lat, s.lng]);
  });
  if (pts.length > 1) L.polyline(pts, { color, weight: 3.5, opacity: .8, dashArray: '7 8' }).addTo(m);
  if (pts.length) m.fitBounds(pts, { padding: [36, 36], maxZoom: 14 }); else m.setView([24.3, 121.1], 8);
  miniMap = m;
  setTimeout(() => m.invalidateSize(), 60);
}
function hotelCard(hk, dayId) {
  const h = HOTELS[hk]; const l = resolveLoc(h.loc);
  const same = (dayId === 'D4' || dayId === 'D5') ? '<p class="small" style="margin:6px 0">ที่พักเดียวกับคืนที่แล้ว</p>' : '';
  return `<div class="card"><h2 class="h2" style="margin-top:0">🛏️ ที่พักแนะนำ</h2><div class="small"><b>${esc(h.title)}</b></div>${same}
    <p style="margin:6px 0 10px;font-size:14.5px">${esc(h.why)}</p>
    ${h.picks.map((p, k) => `<div class="hp"><div class="hp-h"><b>${k + 1}. ${esc(p.n)}</b>${p.tag ? `<span class="badge">${esc(p.tag)}</span>` : ''}</div><div class="small">${esc(p.d)}</div><a class="mapl" href="${gmSearch(p.q)}" target="_blank" rel="noopener">📍 ดูในแผนที่ ↗</a></div>`).join('')}
    <p class="small" style="margin-top:10px">⚠️ คัดจากเว็บจองห้อง/รีวิว ยังไม่ได้เช็คราคาและห้องว่างของวันที่ไป ราคาตัวอย่างเป็นคนละวันกัน ตรวจสอบก่อนจอง</p>
    <a class="mapl" href="${gmSearch(l.q)}" target="_blank" rel="noopener">🗺️ ดูย่านนี้ใน Google Maps ↗</a></div>`;
}
function renderPlan() {
  if (miniMap) { miniMap.remove(); miniMap = null; }
  if (state.day === 'all') renderOverview(); else renderDay();
}
function renderOverview() {
  const urgent = TODO.flatMap(g => g.items).filter(x => x.due === 'ทันที' && !(store.get('tw2026-todo-v1') || {})[x.id]);
  $('#tab-plan').innerHTML = subTabs('all') + `<div class="stack">
    <div class="hero">
      <h2>แผนเที่ยวไต้หวัน 5 วัน 4 คืน</h2>
      <p>ไม่เช่ารถ · เดินทางด้วย HSR / บัส / MRT</p>
      <div class="hero-grid">
        <div class="hero-cell"><b>✈ ขาไป 16 ธ.ค.</b>BKK 01:50 → TPE 06:30</div>
        <div class="hero-cell"><b>✈ ขากลับ 20 ธ.ค.</b>TPE 19:50 → BKK 22:50</div>
        <div class="hero-cell"><b>🛏️ ที่พัก 4 คืน</b>อาลีซาน · SML · ไทเป ×2</div>
        <div class="hero-cell"><b>💰 งบรวม</b>~฿${thb(costTotal())} (2 คน)</div>
      </div>
    </div>
    <div class="card"><h2 class="h2" style="margin-top:0">🗺️ เส้นทางทั้งทริป</h2><div id="ovmap" class="mini"></div>
      <div class="legend">${DAYS.map(d => `<span><i style="background:${dayColor(d.day)}"></i>${d.day}</span>`).join('')}<span>🏨 ที่พัก</span><span>✈ สนามบิน</span></div>
      <p class="small" style="margin-top:6px">ตำแหน่งโดยประมาณ · กดแต่ละวันด้านล่างเพื่อดูแผนที่รายวันและลิงก์ Google Maps</p></div>
    ${urgent.length ? `<div class="card"><h2 class="h2" style="margin-top:0">🔥 ต้องทำก่อน (${urgent.length})</h2>${urgent.map(x => `<div class="bk"><b>${esc(x.t)}</b><div class="small">${esc(x.d)}</div></div>`).join('')}<button class="btn" data-goto="todo" style="margin-top:8px">ไปเช็คลิสต์เตรียมตัว →</button></div>` : ''}
    <h2 class="h2" style="margin:6px 0 0">📅 แต่ละวัน</h2>
    ${DAYS.map(d => {
      const info = DAY_INFO[d.day], ov = OVERVIEW[d.day], h = HOTELS[HOTEL_FOR_DAY[d.day]];
      const cost = dayCosts(d.day).reduce((s, r) => s + r.v, 0);
      return `<button class="ov" data-day="${d.day}" style="--dc:${dayColor(d.day)}">
        <div class="ov-h"><span class="ov-d">${d.day}</span><span class="ov-t">${esc(dayLabel(d))}</span></div>
        <div class="ov-r">${esc(ov.route)}</div>
        <div class="ov-p">${esc(info.headline)}</div>
        <div class="ov-m"><span>${ov.how}</span><span>🛏️ ${d.day === 'D5' ? 'บินกลับ' : esc(h.title.split(' · ')[0]) + ' — ' + esc(h.picks[0].n)}</span></div>
        <div class="ov-m"><span>🎫 ${info.book.length ? `ต้องจอง ${info.book.length} รายการ` : 'ไม่ต้องจองล่วงหน้า'}</span><span>🕒 ${info.schedule.length} ช่วงเวลา</span><span>💰 ~฿${thb(cost)}</span></div>
      </button>`; }).join('')}
    <details class="alert"><summary>⚠️ ต้องเช็คก่อนจอง (${NOTES.length} ข้อ)</summary><ul>${NOTES.map(n => `<li>${esc(n)}</li>`).join('')}</ul></details>
  </div>`;
  bindDay($('#tab-plan'));
  // เส้นทางรวม: สนามบิน → อาลีซาน → SML → ไทเป → (จีหลง/จิ่วเฟิ่น/อูไหล) → สนามบิน
  const el = $('#ovmap'); if (!el) return;
  const m = L.map(el, { scrollWheelZoom: false, dragging: !L.Browser.mobile });
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles &copy; Esri' }).addTo(m);
  const P_ = k => resolveLoc(k);
  const segs = { D1: ['TPE', 'HSR_TY', 'HSR_CY', 'ALI_STN'], D2: ['ALI_STN', 'E2', 'SHUISHE', 'HOTEL_SML'], D3: ['HOTEL_SML', 'HSR_TC', 'TPE_MAIN', 'B1', 'HOTEL_TPE'], D4: ['HOTEL_TPE', 'KEELUNG_STN', 'D1', 'HOTEL_TPE'], D5: ['HOTEL_TPE', 'A2', 'A1', 'TPE'] };
  const pts = [];
  Object.entries(segs).forEach(([dd, ks]) => {
    const ll = ks.map(P_).filter(Boolean).map(s => [s.lat, s.lng]);
    L.polyline(ll, { color: dayColor(dd), weight: 3.5, opacity: .8, dashArray: '7 8' }).addTo(m); pts.push(...ll);
  });
  [['HOTEL_ALI', '🏨'], ['HOTEL_SML', '🏨'], ['HOTEL_TPE', '🏨'], ['TPE', '✈']].forEach(([k, ic]) => { const s = P_(k); L.marker([s.lat, s.lng], { icon: pinIcon(ic, '#172026', false) }).bindTooltip(s.name).addTo(m); });
  m.fitBounds(pts, { padding: [30, 30] });
  miniMap = m; setTimeout(() => m.invalidateSize(), 60);
}
function renderDay() {
  const d = DAYS.find(x => x.day === state.day);
  const i = DAYS.indexOf(d);
  const info = DAY_INFO[d.day];
  const places = (ORDER[d.day] || []).map(c => byCode[c]);
  const legs = LEGS.filter(l => l.day === d.day);
  const visit = places.reduce((s, p) => s + p.hours, 0);
  const travel = legs.reduce((s, l) => s + l.min, 0) / 60;
  const left = d.avail - visit - travel;
  const [cls, txt] = left < 0 ? ['over', 'แน่นเกิน'] : left < 1.5 ? ['tight', 'ตึง'] : ['ok', 'โอเค'];
  const pct = x => Math.max(0, Math.min(100, x / d.avail * 100));
  const dc = dayColor(d.day);
  const costs = dayCosts(d.day), ctot = costs.reduce((s, r) => s + r.v, 0);
  // จุดที่มีพิกัด เรียงตามลำดับในตารางเวลา (ตัดจุดซ้ำติดกัน)
  const stops = []; let prev = null;
  const steps = info.schedule.map(s => {
    const l = resolveLoc(s.loc); let n = null, from = null;
    if (l) {
      if (!prev || prev.key !== l.key) { stops.push({ ...l, n: stops.length + 1, icon: l.key.startsWith('HOTEL_') ? '🏨' : l.key === 'TPE' ? '✈' : null }); }
      n = [...stops].reverse().find(x => x.key === l.key)?.n; from = prev && prev.key !== l.key ? prev : null; prev = l;
    }
    return { ...s, l, n, from };
  });
  $('#tab-plan').innerHTML = subTabs(d.day) + `<div class="stack">
    <div class="card" style="border-top:5px solid ${dc}">
      <div class="dayhead"><h2>${esc(d.day)} · ${esc(dayLabel(d))}</h2><span class="badge ${cls}">${txt} · เหลือ ${fmtH(left)} ชม.</span></div>
      <div class="zone">${esc(d.zone)}</div>
      <p class="headline">${esc(info.headline)}</p>
      <div class="sleep">🛏️ <b>นอน:</b> ${esc(d.sleep)}</div>
      <div class="bar"><i style="width:${pct(visit)}%;background:#2563eb"></i><i style="width:${pct(travel)}%;background:var(--accent)"></i></div>
      <div class="small"><span style="color:#2563eb">■</span> เที่ยว ${fmtH(visit)} ชม. · <span style="color:var(--accent)">■</span> เดินทาง ${fmtH(travel)} ชม. · เวลาที่มี ${d.avail} ชม.</div>
    </div>
    <div class="card"><h2 class="h2" style="margin-top:0">🗺️ แผนที่วันนี้</h2><div id="daymap" class="mini"></div>
      <div class="legend" style="--dc:${dc}">${stops.map(s => `<a href="${gmSearch(s.q)}" target="_blank" rel="noopener"><b class="n" style="background:${dc}">${s.icon || s.n}</b>${esc(s.name)}</a>`).join('')}</div>
      <p class="small" style="margin-top:6px">ตำแหน่งโดยประมาณ · กดชื่อเพื่อเปิด Google Maps</p></div>
    <div class="card"><h2 class="h2" style="margin-top:0">🕒 ตารางเวลา <span class="small">(ประมาณ ${info.schedule.length} ช่วง)</span></h2>
      <div class="sch" style="--dc:${dc}">${steps.map(s => `<div class="sr k-${s.k}"><div class="st">${esc(s.t)}</div><div class="si">${s.i}</div><div class="sc"><div class="stt">${esc(s.title)}</div>${s.d ? `<div class="sd">${esc(s.d)}</div>` : ''}
        ${(s.dur || s.cost || s.l) ? `<div class="chipset">${s.dur ? `<span>⏱ ${esc(s.dur)}</span>` : ''}${s.cost ? `<span>💰 ${esc(s.cost)}</span>` : ''}${s.l ? `<a href="${gmSearch(s.l.q)}" target="_blank" rel="noopener">📍 ${s.l.key.startsWith('HOTEL_') ? '🏨' : s.n}. ${esc(s.l.name)}</a>` : ''}${s.l && s.from ? `<a href="${gmDir(s.from.q, s.l.q)}" target="_blank" rel="noopener">🧭 เส้นทางจากจุดก่อนหน้า</a>` : ''}</div>` : ''}
        ${s.tip ? `<div class="tip">💡 ${esc(s.tip)}</div>` : ''}</div></div>`).join('')}</div>
      <p class="small" style="margin-top:8px">💡 ${esc(d.note)}</p>
    </div>
    ${hotelCard(HOTEL_FOR_DAY[d.day], d.day)}
    ${info.book.length ? `<div class="card"><h2 class="h2" style="margin-top:0">🎫 ต้องจอง/ซื้อสำหรับวันนี้</h2>${info.book.map(b => `<div class="bk"><div><b>${esc(b.t)}</b><span class="due">${esc(b.due)}</span><div class="small">${esc(b.d)}</div></div></div>`).join('')}<button class="btn" data-goto="todo" style="margin-top:10px">ไปเช็คลิสต์เตรียมตัว →</button></div>` : ''}
    ${places.length ? `<div><h2 class="h2" style="margin-top:0">📍 สถานที่วันนี้</h2><div class="pcards">${places.map(p => placeCard(p, true)).join('')}</div></div>` : ''}
    <div class="card"><h2 class="h2" style="margin-top:0">🌦️ อากาศและการเตรียมตัว</h2>
      <div class="wx">
        <div><span>🌡️</span><span><span class="lbl">อากาศปกติ ธ.ค.:</span> ${esc(d.wx)}</span></div>
        <div><span>🎒</span><span><span class="lbl">เตรียม:</span> ${esc(d.pack)}</span></div>
      </div>
      <div class="rain" style="margin-top:12px">☔ <b>ถ้าฝนตก:</b> ${esc(d.rain)}</div>
    </div>
    <div class="card"><h2 class="h2" style="margin-top:0">🆘 แผนสำรอง</h2><ul class="ul">${info.backup.map(b => `<li>${esc(b)}</li>`).join('')}</ul></div>
    ${info.food.length ? `<div class="card"><h2 class="h2" style="margin-top:0">🍜 ของกินที่น่าลอง</h2><div class="foods">${info.food.map(f => `<span>${esc(f)}</span>`).join('')}</div><p class="small" style="margin-top:8px">เป็นข้อแนะนำทั่วไป ไม่ได้จองหรือเช็คร้านไว้</p></div>` : ''}
    <details class="card" open><summary class="sum">🧭 การเดินทาง (${legs.length} ช่วง)</summary><div class="legs" style="margin-top:10px">${legs.map(l => `<div class="leg"><span class="ic">${modeIcon(l.mode)}</span><div><div class="t">${esc(l.frm)} → ${esc(l.to)}</div><div class="m">${esc(l.mode)}${l.km ? ` · ${l.km} กม.` : ''}${l.note ? ` · ${esc(l.note)}` : ''}</div></div><span class="mn">${l.min >= 60 ? fmtH(l.min / 60) + ' ชม.' : l.min + ' น.'}</span></div>`).join('')}</div></details>
    <details class="card"><summary class="sum">💰 ค่าใช้จ่ายวันนี้ ~฿${thb(ctot)} <span class="small">(2 คน ไม่รวมเผื่อ)</span></summary>
      <div style="margin-top:8px">${costs.map(r => `<div class="rowkv"><span>${esc(r.name)}</span><b>฿${thb(r.v)}</b></div>`).join('') || '<p class="small">ไม่มีรายการ</p>'}</div>
      <p class="small" style="margin-top:6px">ตั๋วเครื่องบิน สัมภาระ eSIM ประกัน ไม่ผูกกับวัน · แก้ราคาได้ที่แท็บงบ</p></details>
    <div class="pn">${i > 0 ? `<button data-day="${DAYS[i - 1].day}">← ${DAYS[i - 1].day}</button>` : '<button data-day="all">← ภาพรวม</button>'}${i < DAYS.length - 1 ? `<button data-day="${DAYS[i + 1].day}">${DAYS[i + 1].day} →</button>` : '<button data-day="all">กลับไปภาพรวม</button>'}</div>
  </div>`;
  bindDay($('#tab-plan'));
  drawMiniMap($('#daymap'), stops, dc);
}
function placeCard(p, showTag) {
  const src = img(p);
  return `<button class="pcard" data-place="${p.code}">${src ? `<img src="${esc(src)}" alt="" loading="lazy">` : '<div class="noimg">ยังไม่มีรูป</div>'}<div class="b"><div class="n">${esc(p.name)}</div><div class="s">${esc(p.hours)} ชม. · ${esc(p.best)}</div></div></button>`;
}

/* ---------- map ---------- */
let map, layer, mapFilter = 'plan';
function initMap() {
  if (map) return;
  map = L.map('map', { zoomControl: true }).setView([24.3, 121.1], 8);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles &copy; Esri' }).addTo(map);
  layer = L.layerGroup().addTo(map);
  const opts = [['plan', 'แผนของเรา'], ...DAYS.map(d => [d.day, d.day]), ['all', 'ทั้งหมด']];
  $('#mapbar').innerHTML = `<div class="chips">${opts.map(([v, t]) => `<button class="chip ${v === mapFilter ? 'on' : ''}" data-f="${v}">${t}</button>`).join('')}</div>`;
  $$('#mapbar .chip').forEach(b => b.onclick = () => { mapFilter = b.dataset.f; $$('#mapbar .chip').forEach(x => x.classList.toggle('on', x === b)); drawMap(); });
}
function pinIcon(label, color, small) {
  const s = small ? 22 : 30;
  return L.divIcon({ className: '', iconSize: [s, s], iconAnchor: [s / 2, s / 2], html: `<div class="pin ${small ? 's' : ''}" style="--pc:${color}">${label}</div>` });
}
function drawMap() {
  if (!map) return;
  layer.clearLayers();
  const pts = [];
  const days = mapFilter === 'plan' || mapFilter === 'all' ? DAYS.map(d => d.day) : [mapFilter];
  const pos = c => c === 'AIR' ? AIRPORT : byCode[c];
  days.forEach(dd => {
    L.polyline((ROUTE[dd] || []).map(c => [pos(c).lat, pos(c).lng]), { color: dayColor(dd), weight: 3.5, opacity: .75, dashArray: '7 8' }).addTo(layer);
    (ORDER[dd] || []).forEach((c, k) => {
      const p = byCode[c];
      L.marker([p.lat, p.lng], { icon: pinIcon(`${dd.slice(1)}.${k + 1}`, dayColor(dd)) }).on('click', () => openPlace(c)).addTo(layer);
      pts.push([p.lat, p.lng]);
    });
  });
  L.marker([AIRPORT.lat, AIRPORT.lng], { icon: pinIcon('✈', '#172026') }).bindTooltip('สนามบินเถาหยวน (TPE)').addTo(layer);
  if (mapFilter === 'all') P.filter(p => !p.day).forEach(p => {
    L.marker([p.lat, p.lng], { icon: pinIcon(p.code, '#8a949b', true) }).on('click', () => openPlace(p.code)).addTo(layer); pts.push([p.lat, p.lng]);
  });
  if (mapFilter !== 'all' && mapFilter !== 'plan') (ROUTE[mapFilter] || []).forEach(c => pts.push([pos(c).lat, pos(c).lng]));
  if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 13 });
}

/* ---------- places ---------- */
const F = { q: '', g: 'all', d: 'all' };
function renderPlaces() {
  const groups = ['all', ...Object.keys(GROUP_SHORT)];
  $('#tab-places').innerHTML = `<input class="search" id="q" placeholder="ค้นหา เช่น น้ำพุร้อน, ตลาดกลางคืน" value="${esc(F.q)}">
    <div class="chips" style="margin-top:10px">${groups.map(g => `<button class="chip ${F.g === g ? 'on' : ''}" data-g="${g}">${g === 'all' ? 'ทุกโซน' : GROUP_SHORT[g]}</button>`).join('')}</div>
    <div class="chips">${['all', ...DAYS.map(d => d.day), 'none'].map(v => `<button class="chip ${F.d === v ? 'on' : ''}" data-d="${v}">${v === 'all' ? 'ทุกวัน' : v === 'none' ? 'ยังไม่วาง' : v}</button>`).join('')}</div>
    <div class="small" id="pcount"></div><div class="grid" id="pgrid"></div>`;
  const draw = () => {
    const q = F.q.trim().toLowerCase();
    const list = P.filter(p => (F.g === 'all' || gk(p) === F.g) && (F.d === 'all' || (F.d === 'none' ? !p.day : p.day === F.d)) && (!q || (p.name + ' ' + p.tags + ' ' + p.code).toLowerCase().includes(q)));
    $('#pcount').textContent = `${list.length} แห่ง`;
    $('#pgrid').innerHTML = list.map(p => {
      const src = img(p), main = p.kind.includes('จุดหลัก');
      return `<button class="pcard" data-place="${p.code}"><div class="gh">${src ? `<img src="${esc(src)}" alt="" loading="lazy">` : '<div class="noimg">ยังไม่มีรูป</div>'}<span class="tag" style="--tc:${dayColor(p.day)}">${p.day || p.code}</span>${main ? '<span class="star">⭐</span>' : ''}</div><div class="b"><div class="n">${esc(p.name)}</div><div class="s">${esc(GROUP_SHORT[gk(p)])} · ${esc(p.hours)} ชม. · ${esc(p.rec)}</div></div></button>`;
    }).join('') || '<p class="small">ไม่มีสถานที่ตรงกับตัวกรอง</p>';
  };
  draw();
  $('#q').oninput = e => { F.q = e.target.value; draw(); };
  $$('#tab-places [data-g]').forEach(b => b.onclick = () => { F.g = b.dataset.g; renderPlaces(); });
  $$('#tab-places [data-d]').forEach(b => b.onclick = () => { F.d = b.dataset.d; renderPlaces(); });
}

/* ---------- cost ---------- */
const COST_KEY = 'tw2026-cost-v4';
const defaults = { s: { ...D.settings }, items: D.items.map(i => ({ price: i.price, qty: i.qty })) };
let C = store.get(COST_KEY);
if (!C || C.items?.length !== D.items.length) C = JSON.parse(JSON.stringify(defaults));
function calc(i, idx) {
  const s = C.s, ed = C.items[idx];
  const price = i.kind === 'food' ? s.food : ed.price;
  const mult = i.per === 'คน' ? s.people : i.per === 'ห้อง' ? Math.ceil(s.people / 2) : 1;
  return { price, qty: ed.qty, total: price * ed.qty * mult * (i.cur === 'TWD' ? s.rate : 1) };
}
function costTotal() {
  const sub = D.items.reduce((a, i, idx) => a + calc(i, idx).total, 0);
  return sub * (1 + C.s.buffer);
}
function renderCost() {
  const s = C.s;
  const rows = D.items.map((i, idx) => ({ i, idx, ...calc(i, idx) }));
  const cats = [...new Set(D.items.map(i => i.cat))];
  const sub = rows.reduce((a, r) => a + r.total, 0), total = sub * (1 + s.buffer);
  const flight = rows.find(r => r.i.item.startsWith('ตั๋วเครื่องบิน'));
  const sums = cats.map(c => ({ c, v: rows.filter(r => r.i.cat === c).reduce((a, r) => a + r.total, 0) })).sort((a, b) => b.v - a.v);
  const fld = (k, label, step) => `<div class="field"><label>${label}</label><input type="number" inputmode="decimal" step="${step}" data-s="${k}" value="${s[k]}"></div>`;
  $('#tab-cost').innerHTML = `<div class="stack">
    <div class="card"><div class="small">รวมทั้งหมด (เผื่อ ${Math.round(s.buffer * 100)}% แล้ว)</div><div class="big">฿${thb(total)}</div>
      <div class="rowkv"><span>ต่อคน</span><b>฿${thb(total / s.people)}</b></div>
      <div class="rowkv"><span>ต่อคน ไม่รวมตั๋วเครื่องบิน</span><b>฿${thb((total - flight.total * (1 + s.buffer)) / s.people)}</b></div>
      <div class="rowkv"><span>ห้องพัก</span><b>${Math.ceil(s.people / 2)} ห้อง</b></div></div>
    <div class="card"><h2 style="font-size:17px;font-weight:700">แยกตามหมวด</h2>${sums.map(x => `<div class="cat"><div class="cl"><span>${esc(x.c)}</span><b>฿${thb(x.v)}</b></div><div class="cb" style="width:${Math.max(2, x.v / sub * 100)}%"></div></div>`).join('')}</div>
    <div class="card"><h2 style="font-size:17px;font-weight:700;margin-bottom:10px">ตั้งค่า</h2><div class="fields">${fld('people', 'จำนวนคน', 1)}${fld('rate', 'บาท ต่อ 1 TWD', 0.01)}${fld('food', 'อาหาร TWD/คน/วัน', 50)}${fld('buffer', 'เผื่อ (0.1 = 10%)', 0.05)}</div>
      <p class="small" style="margin-top:10px">ช่องสีเหลืองแก้ได้ ค่าที่แก้จำไว้ในเบราว์เซอร์เครื่องนี้ · ห้องพักคิด 2 คน/ห้อง</p><button class="btn" id="resetCost" style="margin-top:8px">คืนค่าเริ่มต้น</button></div>
  </div>
  ${cats.map(c => { const rs = rows.filter(r => r.i.cat === c); return `<details class="catd" open><summary><span>${esc(c)}</span><span>฿${thb(rs.reduce((a, r) => a + r.total, 0))}</span></summary>${rs.map(r => `<div class="row ${r.i.item.includes('จองแล้ว') ? 'booked' : ''}"><div class="nm">${esc(r.i.item)}</div>${r.i.note ? `<div class="small">${esc(r.i.note)}</div>` : ''}<div class="ed">${r.i.kind === 'food' ? `<span class="unit">${r.price} ${r.i.cur}/คน/วัน</span>` : `<div><input type="number" inputmode="decimal" data-i="${r.idx}" data-f="price" value="${r.price}"><span class="unit">${r.i.cur} ต่อ${esc(r.i.per)}</span></div>`}<div><input type="number" inputmode="decimal" data-i="${r.idx}" data-f="qty" value="${r.qty}"><span class="unit">จำนวน</span></div><span class="tot">฿${thb(r.total)}</span></div></div>`).join('')}</details>`; }).join('')}
  <p class="small" style="margin-top:14px">⚠️ ราคาส่วนใหญ่เป็นค่าประมาณ ยังไม่ได้เช็คราคาจริง · ตั๋วเครื่องบินจองแล้ว 14,090 บาท (2 คน) · ค่าสัมภาระโหลดยังเป็นค่าสมมติ</p>`;
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
  $('#tab-todo').innerHTML = `<div class="card"><b>เตรียมตัวแล้ว ${n}/${all.length} ข้อ</b><div class="prog"><i style="width:${n / all.length * 100}%"></i></div><p class="small" style="margin-top:8px">ติ๊กเมื่อทำเสร็จ · จำไว้ในเบราว์เซอร์เครื่องนี้</p></div>` +
    TODO.map(g => `<h2 class="h2">${esc(g.group)}</h2><div class="card">${g.items.map(i => `<label class="todo ${done[i.id] ? 'done' : ''}"><input type="checkbox" data-id="${i.id}" ${done[i.id] ? 'checked' : ''}><span><span class="tt">${esc(i.t)}<span class="due">${esc(i.due)}</span></span>${i.d ? `<span class="dd" style="display:block">${esc(i.d)}</span>` : ''}</span></label>`).join('')}</div>`).join('');
  $$('#tab-todo input').forEach(c => c.onchange = () => { done[c.dataset.id] = c.checked; store.set(TODO_KEY, done); renderTodo(); });
}

/* ---------- boot ---------- */
parseHash();
renderPlaces(); renderCost(); renderTodo();
window.addEventListener('hashchange', () => { parseHash(); show(); });
show();
