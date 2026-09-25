#!/usr/bin/env node
// Builds the README's static visuals from the newest Detox recordings:
//
//   assets/hero-light.webp, assets/hero-dark.webp   overview grid (README hero)
//   docs/static/img/social-card.png                 Open Graph / social preview
//
// Needs ffmpeg and Google Chrome (or CHROME=/path/to/chromium). Run the Detox
// flows first (see scripts/generate-readme-gifs.sh), then:
//   node scripts/visuals/stills.mjs
// KEEP_PNG=1 also keeps the full-size PNG next to each WebP.
import fs from 'node:fs';
import path from 'node:path';
import {
  ASSETS_DIR,
  DOCS_STATIC_DIR,
  FONT_STACK,
  extractFrame,
  ffmpeg,
  fileUrl,
  fmtBytes,
  makeTempDir,
  newestRecording,
  renderHtml,
} from './lib.mjs';
import { COMPONENTS, THEME_DARK, byKey } from './shots.mjs';

const work = makeTempDir('rnpc-stills-');
const frames = {};

function frame(key, platform, shot, testName) {
  const id = `${key}-${platform}`;
  if (frames[id]) return frames[id];
  const input = newestRecording(platform, testName);
  if (!input) throw new Error(`No ${platform} recording for "${testName}" under example/artifacts`);
  const out = path.join(work, `${id}.png`);
  extractFrame({ input, time: shot.time, crop: shot.crop, out });
  frames[id] = out;
  return out;
}

const THEMES = {
  light: {
    bg: '#f6f8fa',
    tile: '#ffffff',
    border: '#d8dee4',
    text: '#1f2328',
    muted: '#656d76',
    chip: '#eaeef2',
    chipText: '#57606a',
    iosBg: '#f1f8f9',
    androidBg: '#eef1ee',
  },
  dark: {
    bg: '#0d1117',
    tile: '#161b22',
    border: '#30363d',
    text: '#e6edf3',
    muted: '#8d96a0',
    chip: '#21262d',
    chipText: '#c9d1d9',
    iosBg: '#f1f8f9',
    androidBg: '#eef1ee',
  },
};

// The grid: 12 columns; rows carry their own height so every tile in a row
// lines up. `span` is in columns.
const HERO_WIDTH = 1400;
const PAD = 36;
const GAP = 18;
const HEADER = 34;
const ROWS = [
  {
    height: 400,
    tiles: [
      { key: 'datepicker', platform: 'ios', span: 3, fit: 'contain', position: 'center' },
      { key: 'datepicker', platform: 'android', span: 3, fit: 'contain', position: 'center' },
      { key: 'textfield', platform: 'ios', span: 3 },
      { key: 'textfield', platform: 'android', span: 3 },
    ],
  },
  {
    height: 430,
    tiles: [
      { key: 'segmentedcontrol', platform: 'ios', span: 3 },
      { key: 'segmentedcontrol', platform: 'android', span: 3 },
      { key: 'button', platform: 'ios', span: 3 },
      { key: 'button', platform: 'android', span: 3 },
    ],
  },
  {
    height: 300,
    tiles: [
      { key: 'tabbar', platform: 'ios', span: 6 },
      { key: 'tabbar', platform: 'android', span: 6 },
    ],
  },
  {
    height: 380,
    tiles: [
      { key: 'navigationrail', platform: 'ios', span: 3 },
      { key: 'navigationrail', platform: 'android', span: 3 },
      { key: 'floatingactionbutton', platform: 'ios', span: 3 },
      { key: 'floatingactionbutton', platform: 'android', span: 3 },
    ],
  },
  {
    height: 350,
    tiles: [
      { key: 'contextmenu', platform: 'ios', span: 3, position: 'center' },
      { key: 'contextmenu', platform: 'android', span: 3, position: 'center' },
      { key: 'liquidglass', platform: 'ios', span: 6, position: 'center' },
    ],
  },
  {
    // The view-switcher capsules are wide and short, so this row is shallow
    height: 210,
    tiles: [
      { key: 'floatingtoolbar', platform: 'ios', span: 6, position: 'center' },
      { key: 'floatingtoolbar', platform: 'android', span: 6, position: 'center' },
    ],
  },
  {
    height: 380,
    tiles: [
      { key: 'selectionmenu', platform: 'ios', span: 3 },
      { key: 'selectionmenu', platform: 'android', span: 3 },
      { key: 'theme-dark', platform: 'ios', span: 3, dark: true, label: 'Dark mode' },
      { key: 'theme-dark', platform: 'android', span: 3, dark: true, label: 'Dark mode' },
    ],
  },
];

function tileImage(tile) {
  if (tile.key === 'theme-dark') {
    return frame('theme-dark', tile.platform, THEME_DARK[tile.platform], byKey.theme.test);
  }
  const c = byKey[tile.key];
  return frame(tile.key, tile.platform, c.still[tile.platform], c.test);
}

function platformLabel(p) {
  return p === 'ios' ? 'iOS' : 'Android';
}

function heroHtml(themeName) {
  const t = THEMES[themeName];
  const height = PAD * 2 + ROWS.reduce((s, r) => s + r.height, 0) + GAP * (ROWS.length - 1);
  const rowsHtml = ROWS.map((row) => {
    const tiles = row.tiles
      .map((tile) => {
        const img = tileImage(tile);
        const name = tile.label ?? byKey[tile.key].name;
        const dark = tile.dark ? ' dark' : '';
        const shot = tile.key === 'theme-dark' ? null : byKey[tile.key].still[tile.platform];
        const bg = shot?.bg ?? (tile.dark ? '#000000' : tile.platform === 'ios' ? t.iosBg : t.androidBg);
        const fit = tile.fit ?? 'cover';
        const position = tile.position ?? 'top center';
        return `
        <figure class="tile${dark}" style="grid-column: span ${tile.span}">
          <figcaption><span class="name">${name}</span><span class="chip">${platformLabel(tile.platform)}</span></figcaption>
          <div class="shot" style="background:${bg}"><img src="${fileUrl(img)}" alt="" style="object-fit:${fit};object-position:${position}" /></div>
        </figure>`;
      })
      .join('');
    return `<div class="row" style="height:${row.height}px">${tiles}</div>`;
  }).join('');

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  html, body { margin: 0; width: ${HERO_WIDTH}px; height: ${height}px; background: ${t.bg}; }
  body { font-family: ${FONT_STACK}; color: ${t.text}; -webkit-font-smoothing: antialiased; }
  .grid { padding: ${PAD}px; display: flex; flex-direction: column; gap: ${GAP}px; }
  .row { display: grid; grid-template-columns: repeat(12, 1fr); gap: ${GAP}px; }
  .tile { margin: 0; border-radius: 16px; border: 1px solid ${t.border}; background: ${t.tile};
          overflow: hidden; display: flex; flex-direction: column; min-width: 0; }
  figcaption { height: ${HEADER}px; padding: 0 12px 0 14px; display: flex; align-items: center;
               justify-content: space-between; font-size: 13.5px; font-weight: 600;
               letter-spacing: -0.01em; }
  .chip { font-size: 11px; font-weight: 600; letter-spacing: 0.01em;
          color: ${t.chipText}; background: ${t.chip}; border-radius: 999px; padding: 3px 9px; }
  .shot { flex: 1; min-height: 0; position: relative; }
  .shot img { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  .tile.dark { background: #1c1c1e; border-color: ${themeName === 'dark' ? '#3a3a3c' : '#2c2c2e'}; color: #f2f2f7; }
  .tile.dark .chip { background: #2c2c2e; color: #d1d1d6; }
</style></head>
<body><div class="grid">${rowsHtml}</div></body></html>`;
}

function socialHtml() {
  const t = THEMES.light;
  const shots = [
    ['datepicker', 'android'],
    ['contextmenu', 'ios'],
    ['segmentedcontrol', 'android'],
    ['button', 'ios'],
  ].map(([key, platform]) => ({ img: tileImage({ key, platform }), key, platform }));
  const tiles = shots
    .map(
      (s) => `
      <figure class="tile">
        <figcaption><span>${byKey[s.key].name}</span><span class="chip">${platformLabel(s.platform)}</span></figcaption>
        <div class="shot" style="background:${byKey[s.key].still[s.platform].bg ?? (s.platform === 'ios' ? t.iosBg : t.androidBg)}"><img src="${fileUrl(s.img)}" alt="" /></div>
      </figure>`
    )
    .join('');
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 1280px; height: 640px; background: ${t.bg}; }
  body { font-family: ${FONT_STACK}; color: ${t.text}; -webkit-font-smoothing: antialiased;
         display: flex; padding: 48px 56px; gap: 40px; }
  .copy { width: 470px; display: flex; flex-direction: column; justify-content: center; }
  h1 { font-size: 40px; line-height: 1.08; margin: 0 0 18px; letter-spacing: -0.03em; font-weight: 700; }
  h1 small { display: block; font-size: 18px; font-weight: 500; color: ${t.muted}; letter-spacing: 0; margin-bottom: 10px; }
  p { font-size: 19px; line-height: 1.4; color: #424a53; margin: 0 0 22px; }
  .tags { display: flex; flex-wrap: wrap; gap: 8px; }
  .tag { font-size: 13px; font-weight: 600; padding: 6px 11px; border-radius: 999px; background: #ffffff;
         border: 1px solid ${t.border}; color: #24292f; }
  .tag.ios { background: #eaf3ff; border-color: #c4dbff; color: #0b4fa8; }
  .tag.android { background: #eef7ee; border-color: #c8e6c9; color: #1b5e20; }
  .grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 14px; }
  .tile { margin: 0; border-radius: 14px; border: 1px solid ${t.border}; background: #fff; overflow: hidden;
          display: flex; flex-direction: column; min-height: 0; }
  figcaption { height: 30px; padding: 0 10px 0 12px; display: flex; align-items: center; justify-content: space-between;
               font-size: 12.5px; font-weight: 600; }
  .chip { font-size: 10px; font-weight: 600; color: ${t.chipText};
          background: ${t.chip}; border-radius: 999px; padding: 2px 8px; }
  .shot { flex: 1; min-height: 0; position: relative; }
  .shot img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }
</style></head>
<body>
  <div class="copy">
    <h1><small>react-native-platform-components</small>Native components for React Native, on both platforms</h1>
    <p>TextField, DatePicker, ContextMenu, SelectionMenu, SegmentedControl, TabBar, NavigationRail, Button, ButtonGroup, FloatingActionButton, FloatingToolbar and LiquidGlass. Real UIKit and Material 3 Expressive widgets behind one typed API.</p>
    <div class="tags"><span class="tag ios">iOS · UIKit &amp; SwiftUI</span><span class="tag android">Android · Material 3 Expressive</span><span class="tag">TypeScript</span><span class="tag">Expo</span></div>
  </div>
  <div class="grid">${tiles}</div>
</body></html>`;
}

function toWebp(png, out, quality = 90) {
  ffmpeg(['-i', png, '-c:v', 'libwebp', '-lossless', '0', '-q:v', String(quality), '-compression_level', '6', out]);
}

console.log('=== README stills ===');
for (const themeName of ['light', 'dark']) {
  const png = path.join(work, `hero-${themeName}.png`);
  const height = PAD * 2 + ROWS.reduce((s, r) => s + r.height, 0) + GAP * (ROWS.length - 1);
  renderHtml({ html: heroHtml(themeName), width: HERO_WIDTH, height, scale: 2, out: png, workDir: work });
  const webp = path.join(ASSETS_DIR, `hero-${themeName}.webp`);
  toWebp(png, webp);
  if (process.env.KEEP_PNG) fs.copyFileSync(png, path.join(ASSETS_DIR, `hero-${themeName}.png`));
  console.log(`  ${path.relative(process.cwd(), webp)} (${fmtBytes(fs.statSync(webp).size)}, ${HERO_WIDTH * 2}x${height * 2})`);
}

{
  const png = path.join(work, 'social-card.png');
  renderHtml({ html: socialHtml(), width: 1280, height: 640, scale: 1.5, out: png, workDir: work });
  const imgDir = path.join(DOCS_STATIC_DIR, 'img');
  fs.mkdirSync(imgDir, { recursive: true });
  const out = path.join(imgDir, 'social-card.png');
  fs.copyFileSync(png, out);
  console.log(`  ${path.relative(process.cwd(), out)} (${fmtBytes(fs.statSync(out).size)})`);
}

if (process.env.KEEP_WORK) console.log(`  work dir: ${work}`);
else fs.rmSync(work, { recursive: true, force: true });
