// "Today" mode: works out which day/step of the plan is happening now, in Taiwan time (UTC+8).
// For testing, add ?now=2026-12-17T08:30 to the URL (read as Taiwan local time).
const q = new URLSearchParams(location.search).get('now');
export const NOW_OVERRIDE = q && !isNaN(Date.parse(q + ':00+08:00')) ? q : null;
export const nowTW = () => (NOW_OVERRIDE ? new Date(NOW_OVERRIDE + ':00+08:00') : new Date());

const twParts = d => { const t = new Date(d.getTime() + 8 * 3600e3); return { date: t.toISOString().slice(0, 10), min: t.getUTCHours() * 60 + t.getUTCMinutes(), hm: t.toISOString().slice(11, 16) }; };
const stepMin = t => { const m = /(\d{1,2}):(\d{2})/.exec(t || ''); return m ? +m[1] * 60 + +m[2] : null; };

// { day, min, hm } when "now" falls on a trip day, otherwise null
export function todayInfo(days) {
  const p = twParts(nowTW()), d = days.find(x => x.date === p.date);
  return d ? { day: d.day, min: p.min, hm: p.hm } : null;
}

// index of the step in progress (last one whose time has passed) and the next one
export function stepNow(steps, min) {
  let cur = -1;
  steps.forEach((s, i) => { const m = stepMin(s.t); if (m !== null && m <= min) cur = i; });
  return { cur, next: cur + 1 < steps.length ? cur + 1 : -1 };
}
