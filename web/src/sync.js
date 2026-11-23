// Share the checklist and budget between two phones with a link. There is no server, so this is a
// one-off snapshot: whoever opens the link imports it. Live two-way sync would need a backend.
const b64 = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

const copy = url => (navigator.clipboard
  ? navigator.clipboard.writeText(url).then(() => 'copied', () => { window.prompt('คัดลอกลิงก์นี้ส่งให้อีกคน', url); return 'prompt'; })
  : Promise.resolve(window.prompt('คัดลอกลิงก์นี้ส่งให้อีกคน', url)).then(() => 'prompt'));

export function shareLink(data) {
  return location.origin + location.pathname + '#sync=' + b64(JSON.stringify({ v: 1, ...data }));
}
export function shareState(data) {
  const url = shareLink(data);
  if (navigator.share) return navigator.share({ title: 'ทริปไต้หวัน: เช็คลิสต์และงบ', url }).then(() => 'shared', e => (e && e.name === 'AbortError' ? 'cancel' : copy(url)));
  return copy(url);
}
export function readShared() {
  const m = /^#sync=([\w-]+)/.exec(location.hash);
  if (!m) return null;
  try { const d = JSON.parse(unb64(m[1])); return d && d.v === 1 ? d : null; } catch { return null; }
}
