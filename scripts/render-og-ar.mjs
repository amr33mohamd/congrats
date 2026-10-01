/**
 * Renders the Arabic share card (public/brand/og-ar.png, 1200×630).
 *
 * next/og (Satori) can't shape Arabic script, so /ar/og serves this
 * pre-rendered PNG instead. Same design as components/marketing/og-card.tsx,
 * drawn by Chromium so the letters join correctly.
 * Run: node scripts/render-og-ar.mjs
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const mark = readFileSync(new URL('../public/brand/logomark.svg', import.meta.url), 'utf8');
const card = (l, t, r, a, b, s = 1) => `<div class="c" style="left:${l}px;top:${t}px;width:${190 * s}px;height:${338 * s}px;border-radius:${26 * s}px;transform:rotate(${r}deg);background:linear-gradient(160deg,${a},${b})"><i style="width:${70 * s}px"></i><b style="width:${110 * s}px;height:${12 * s}px;margin-top:${18 * s}px"></b><b style="width:${80 * s}px;height:${8 * s}px;margin-top:${10 * s}px;opacity:.6"></b><i style="width:${70 * s}px;margin-top:${18 * s}px"></i></div>`;

const html = `<!doctype html><html dir="rtl"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;800&display=swap" rel="stylesheet">
<style>
body{margin:0;width:1200px;height:630px;overflow:hidden;font-family:Cairo,sans-serif;color:#fff;background:#0C0A0B;
background-image:radial-gradient(circle at 22% 22%,rgba(240,67,110,.45),transparent 45%),radial-gradient(circle at 8% 88%,rgba(214,164,53,.32),transparent 40%),radial-gradient(circle at 92% 90%,rgba(174,31,68,.35),transparent 45%);position:relative}
.c{position:absolute;border:2px solid rgba(214,164,53,.45);box-shadow:0 30px 60px rgba(0,0,0,.55);display:flex;flex-direction:column;align-items:center;justify-content:center}
.c i{display:block;height:2px;background:rgba(233,198,103,.9)}.c b{display:block;border-radius:6px;background:rgba(255,255,255,.85)}
.copy{position:absolute;right:80px;top:0;bottom:0;width:700px;display:flex;flex-direction:column;justify-content:center}
.brand{display:flex;align-items:center;gap:18px;font-size:44px;font-weight:800}.brand svg{width:64px;height:64px}
h1{font-size:76px;line-height:1.2;margin:34px 0 0;font-weight:800}
p{font-size:32px;margin:22px 0 0;color:rgba(255,255,255,.75);line-height:1.45;font-weight:600}
.tag{margin-top:30px;font-size:26px;color:#E9C667;font-weight:600}
</style></head><body>
${card(70, 150, 11, '#3B0F1F', '#AE1F44', 0.9)}${card(250, 160, -10, '#1B1410', '#6B4E16', 0.9)}${card(160, 120, 2, '#F0436E', '#7A1330')}
<div class="copy"><div class="brand">${mark}<span>Congrats</span></div>
<h1>ابعت لحظة<br>مش هينسوها</h1>
<p>تهاني متحركة ودعوات أفراح بالاسم والصور — تتبعت بلينك واحد</p>
<div class="tag">عيد ميلاد · فرح · خطوبة · نجاح · مولود · وكل المناسبات</div></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: new URL('../public/brand/og-ar.png', import.meta.url).pathname });
await browser.close();
console.log('wrote public/brand/og-ar.png');
