// Generic helpers shared by every tab.
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
};
export const thb = n => Math.round(n).toLocaleString('th-TH');
export const fmtH = h => (Math.round(h * 10) / 10).toFixed(1);
export const enc = encodeURIComponent;
export const gmSearch = q => 'https://www.google.com/maps/search/?api=1&query=' + enc(q);
export const gmDir = (a, b) => `https://www.google.com/maps/dir/?api=1&origin=${enc(a)}&destination=${enc(b)}&travelmode=transit`;
export const seg = (items, cur, attr) => `<div class="seg">${items.map(([v, t, s]) => `<button class="${v === cur ? 'on' : ''}" ${attr}="${v}">${t}${s ? `<small>${s}</small>` : ''}</button>`).join('')}</div>`;
export const blk = (title, inner, sub = '') => `<div class="blk"><h2>${title}</h2>${sub ? `<p class="blk-sub">${sub}</p>` : ''}${inner}</div>`;
export const tile = (inner, cls = '') => `<div class="tile ${cls}">${inner}</div>`;
