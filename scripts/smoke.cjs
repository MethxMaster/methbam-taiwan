// Smoke test: npm run build, serve docs/ (python3 -m http.server 4173 -d docs), then: node scripts/smoke.cjs
// Smoke test: open every tab and every day page; report JS errors and a few key facts.
const { chromium } = require('playwright');
(async () => {
  const base = process.argv[2] || 'http://localhost:4173/';
  const b = await chromium.launch(); const errs = [];
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/tile|arcgis|fonts|Failed to load|ERR_/.test(m.text())) errs.push('console:' + m.text()); });
  const hashes = ['#plan', '#plan/D1', '#plan/D2', '#plan/D3', '#plan/D4', '#plan/D5', '#map', '#places', '#food', '#hotels', '#transport', '#cost', '#todo'];
  for (const h of hashes) {
    await p.goto(base + h); await p.reload(); await p.waitForTimeout(700);
    const info = await p.evaluate(() => ({ tab: document.querySelector('section.on')?.id, len: document.querySelector('section.on')?.innerText.length }));
    if (!info.tab || info.len < 50) errs.push(`empty ${h}`);
  }
  await p.goto(base + '#plan/D4'); await p.reload(); await p.waitForTimeout(800);
  const d4 = await p.evaluate(() => [...document.querySelectorAll('.sr .stt')].map(e => e.textContent));
  console.log('D4 steps:', d4.join(' | '));
  await p.goto(base + '#plan/D1'); await p.reload(); await p.waitForTimeout(800);
  console.log('D1 steps:', (await p.evaluate(() => [...document.querySelectorAll('.sr .stt')].map(e => e.textContent))).slice(4, 9).join(' | '));
  console.log('ERRORS', errs.length ? errs : 'none');
  await b.close();
})();
