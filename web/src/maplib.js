// Leaflet helpers: tiles, fullscreen button, route legs with arrows, numbered pins.
import L from 'leaflet';

export const pinIcon = (label, cls = '', color = '') => L.divIcon({ className: '', iconSize: null, html: `<div class="pin ${cls}" ${color ? `style="--pc:${color}"` : ''}>${label}</div>` });
export const baseTiles = m => L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles &copy; Esri' }).addTo(m);

// ปุ่มดูแผนที่เต็มจอ (ใช้ CSS ไม่พึ่ง Fullscreen API เพื่อให้ทำงานบน iPhone ได้)
const FS_OPEN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
const FS_CLOSE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
export function addFullscreen(m) {
  const el = m.getContainer();
  const orig = { drag: m.dragging.enabled(), wheel: m.scrollWheelZoom.enabled() };
  let on = false, btn;
  const toggle = (force) => {
    on = typeof force === 'boolean' ? force : !on;
    el.classList.toggle('mapfs', on);
    document.body.classList.toggle('no-scroll', on);
    btn.innerHTML = on ? FS_CLOSE : FS_OPEN;
    btn.setAttribute('aria-label', on ? 'ออกจากเต็มจอ' : 'ดูเต็มจอ');
    if (on) { m.dragging.enable(); m.scrollWheelZoom.enable(); }
    else { if (!orig.drag) m.dragging.disable(); if (!orig.wheel) m.scrollWheelZoom.disable(); }
    setTimeout(() => { m.invalidateSize(); if (m._spread) m._spread(); }, 60);
  };
  const C = L.Control.extend({
    options: { position: 'topright' },
    onAdd() {
      btn = L.DomUtil.create('button', 'fsbtn');
      btn.type = 'button'; btn.innerHTML = FS_OPEN; btn.setAttribute('aria-label', 'ดูเต็มจอ');
      L.DomEvent.disableClickPropagation(btn);
      btn.onclick = () => toggle();
      return btn;
    },
  });
  m.addControl(new C());
  const onKey = e => { if (e.key === 'Escape' && on) toggle(false); };
  document.addEventListener('keydown', onKey);
  m.on('unload', () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('no-scroll'); });
}
export const DAYC = { D1: '#0071e3', D2: '#af52de', D3: '#ff2d55', D4: '#ff9500', D5: '#34c759' };
export const dayColor = d => DAYC[d] || '#8a949b';
const MERC = L.Projection.SphericalMercator;
const bearing = (a, b) => { const p = MERC.project(L.latLng(a)), q = MERC.project(L.latLng(b)); return Math.atan2(q.x - p.x, q.y - p.y) * 180 / Math.PI; };
// เส้นทางจริงระหว่างสองจุด พร้อมลูกศรบอกทิศ (off = เลื่อนเส้นออกข้างเมื่อเป็นขากลับทางเดิม)
export function addLeg(target, a, b, color, off = 0, w = 4, op = .9) {
  let A = [a.lat, a.lng], B = [b.lat, b.lng];
  if (off) { const dx = B[1] - A[1], dy = B[0] - A[0], len = Math.hypot(dx, dy) || 1, ox = -dy / len * off, oy = dx / len * off; A = [A[0] + oy, A[1] + ox]; B = [B[0] + oy, B[1] + ox]; }
  L.polyline([A, B], { color, weight: w, opacity: op, lineCap: 'round' }).addTo(target);
  const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  L.marker(mid, { icon: L.divIcon({ className: '', iconSize: [16, 16], iconAnchor: [8, 8], html: `<div class="arr" style="color:${color};transform:rotate(${bearing(A, B)}deg)">▲</div>` }), interactive: false, keyboard: false }).addTo(target);
}
// วางหมุดเลข กระจายออกจากกันเมื่อซ้อนกันบนหน้าจอ (คำนวณใหม่ทุกครั้งที่ซูม)
export function spreadPins(m, group, items) {
  const draw = () => {
    group.clearLayers();
    const pts = items.map(it => m.latLngToContainerPoint([it.lat, it.lng]));
    const clusters = [];
    items.forEach((it, i) => {
      const c = clusters.find(cl => Math.hypot(pts[cl[0]].x - pts[i].x, pts[cl[0]].y - pts[i].y) < 24);
      if (c) c.push(i); else clusters.push([i]);
    });
    clusters.forEach(c => c.forEach((i, k) => {
      let dx = 0, dy = 0;
      if (c.length > 1) { const ang = (k / c.length) * 2 * Math.PI - Math.PI / 2, R = Math.max(18, c.length * 30 / (2 * Math.PI)); dx = Math.cos(ang) * R; dy = Math.sin(ang) * R; }
      const it = items[i];
      const icon = L.divIcon({ className: '', iconSize: [28, 28], iconAnchor: [14 - dx, 14 - dy], html: `<div class="pin ${it.cls || ''}" ${it.color ? `style="--pc:${it.color}"` : ''}>${it.label}</div>` });
      const mk = L.marker([it.lat, it.lng], { icon }).bindTooltip(it.tip).addTo(group);
      if (it.click) mk.on('click', it.click);
    }));
  };
  draw();
  if (m._spread) m.off('zoomend', m._spread);
  m._spread = draw; m.on('zoomend', draw);
}
