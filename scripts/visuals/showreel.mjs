#!/usr/bin/env node
// Builds the README showreel from the newest Detox recording of each flow:
// one clip per component, cropped to the component with iOS on the left and
// Android on the right, cross-fading from one to the next and ending on a
// title card.
//
//   assets/showreel.gif             for the README (GitHub and npm)
//   docs/static/video/showreel.mp4  for the documentation site
//   docs/static/video/showreel.jpg  its poster frame
//
// Needs ffmpeg and Google Chrome (or CHROME=/path/to/chromium), which draws
// the captions and panel frames. Run the flows first (see
// scripts/generate-readme-gifs.sh), then:
//   node scripts/visuals/showreel.mjs
// CLIP_SECONDS (default 4) is the length of a component's clip; the Theme
// clip sets its own. GIF_WIDTH (default 928) sets the GIF's width; the README
// shows it at half that, so it stays crisp on a retina display.
import fs from 'node:fs';
import path from 'node:path';
import {
  ASSETS_DIR,
  DOCS_STATIC_DIR,
  FONT_STACK,
  cropExpr,
  ffmpeg,
  fmtBytes,
  makeTempDir,
  newestRecording,
  probe,
  renderHtml,
} from './lib.mjs';
import { COMPONENTS } from './shots.mjs';

const W = 1160;
const H = 760;
const FPS = 30;
const GIF_FPS = 12;
const CLIP_SECONDS = parseFloat(process.env.CLIP_SECONDS || '4.0');
const XFADE = 0.45;
const BG = '#f6f8fa';
const PANEL_TOP = 134;
const PANEL_BOTTOM = H - 34;
const PANEL_MAX_W = { left: 520, right: 520, single: 1000 };
const PANEL_RADIUS = 18;
const HALF_CENTERS = { left: 300, right: W - 300, single: W / 2 };

const work = makeTempDir('rnpc-showreel-');
const keepWork = !!process.env.KEEP_WORK;

function fitPanel(aspect, slot) {
  const maxH = PANEL_BOTTOM - PANEL_TOP;
  let w = PANEL_MAX_W[slot];
  let h = Math.round(w / aspect);
  if (h > maxH) {
    h = maxH;
    w = Math.round(h * aspect);
  }
  w -= w % 2;
  h -= h % 2;
  return { w, h };
}

function placePanel(size, slot) {
  const cx = HALF_CENTERS[slot];
  const x = Math.round(cx - size.w / 2);
  const y = Math.round(PANEL_TOP + (PANEL_BOTTOM - PANEL_TOP - size.h) / 2);
  return { ...size, x, y };
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** The frame around the recordings: background, caption, panel borders. */
function chromeHtml({ title, subtitle, panels }) {
  const holes = panels
    .map((p) => `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${PANEL_RADIUS}" fill="#000"/>`)
    .join('');
  const shadows = panels
    .map((p) => `<rect x="${p.x}" y="${p.y + 6}" width="${p.w}" height="${p.h}" rx="${PANEL_RADIUS}" fill="#000" opacity="0.16" filter="url(#blur)"/>`)
    .join('');
  const borders = panels
    .map((p) => `<rect x="${p.x + 0.5}" y="${p.y + 0.5}" width="${p.w - 1}" height="${p.h - 1}" rx="${PANEL_RADIUS}" fill="none" stroke="rgba(31,35,40,0.14)"/>`)
    .join('');
  const labels = panels
    .map((p) => `<div class="label" style="left:${p.x}px;width:${p.w}px;top:${p.y - 26}px">${esc(p.label)}</div>`)
    .join('');
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html, body { margin: 0; width: ${W}px; height: ${H}px; background: transparent; overflow: hidden; }
  body { font-family: ${FONT_STACK}; -webkit-font-smoothing: antialiased; position: relative; }
  svg { position: absolute; inset: 0; }
  .title { position: absolute; left: 40px; top: 30px; font-size: 30px; font-weight: 700; letter-spacing: -0.02em; color: #1f2328; }
  .subtitle { position: absolute; left: 40px; top: 70px; font-size: 15px; color: #656d76; }
  .label { position: absolute; text-align: center; font-size: 12.5px; font-weight: 600; color: #656d76; }
  .footer { position: absolute; right: 40px; bottom: 12px; font-size: 11.5px; color: #8c959f; }
</style></head>
<body>
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <mask id="holes"><rect width="${W}" height="${H}" fill="#fff"/>${holes}</mask>
      <filter id="blur" x="-10%" y="-10%" width="120%" height="130%"><feGaussianBlur stdDeviation="10"/></filter>
    </defs>
    <rect width="${W}" height="${H}" fill="${BG}" mask="url(#holes)"/>
    <g mask="url(#holes)">${shadows}</g>
    ${borders}
  </svg>
  <div class="title">${esc(title)}</div>
  <div class="subtitle">${esc(subtitle)}</div>
  ${labels}
  <div class="footer">react-native-platform-components</div>
</body></html>`;
}

function cardHtml() {
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html, body { margin: 0; width: ${W}px; height: ${H}px; background: ${BG}; }
  body { font-family: ${FONT_STACK}; -webkit-font-smoothing: antialiased; display: flex; align-items: center; justify-content: center; }
  .card { text-align: center; }
  h1 { font-size: 36px; font-weight: 700; letter-spacing: -0.02em; color: #1f2328; margin: 0 0 14px; }
  p { font-size: 19px; color: #656d76; margin: 0; }
</style></head>
<body><div class="card"><h1>react-native-platform-components</h1><p>Native on iOS and Android. One typed API.</p></div></body></html>`;
}

function panelSpec(component, platform, video) {
  const shot = component.clip[platform];
  const info = probe(video);
  const crop = shot.crop;
  const aspect = (info.width * crop.w) / (info.height * crop.h);
  const start = shot.start;
  const duration = component.clip.duration ?? CLIP_SECONDS;
  if (start + duration > info.duration + 0.05) {
    console.warn(
      `  warning: ${component.name} ${platform} clip runs past the recording (${(start + duration).toFixed(1)}s of ${info.duration.toFixed(1)}s); the last frame will hold`
    );
  }
  return { video, crop, aspect, start, duration };
}

function buildClip(component, index) {
  const duration = component.clip.duration ?? CLIP_SECONDS;
  const platforms = component.iosOnly ? ['ios'] : ['ios', 'android'];
  const specs = {};
  for (const p of platforms) {
    const video = newestRecording(p, component.test);
    if (!video) throw new Error(`No ${p} recording for "${component.test}" under example/artifacts`);
    specs[p] = panelSpec(component, p, video);
  }
  const panels = platforms.map((p) => {
    const slot = component.iosOnly ? 'single' : p === 'ios' ? 'left' : 'right';
    const placed = placePanel(fitPanel(specs[p].aspect, slot), slot);
    return { ...placed, platform: p, label: p === 'ios' ? (component.iosOnly ? 'iOS 26' : 'iOS') : 'Android' };
  });

  const subtitle = component.caption ?? `${component.native.ios} on iOS  ·  ${component.native.android} on Android`;
  const chrome = path.join(work, `chrome-${index}.png`);
  renderHtml({
    html: chromeHtml({ title: component.name, subtitle, panels }),
    width: W,
    height: H,
    scale: 1,
    out: chrome,
    transparent: true,
    workDir: work,
  });

  const args = ['-f', 'lavfi', '-i', `color=c=${BG}:s=${W}x${H}:r=${FPS}:d=${duration}`];
  const filters = ['[0:v]format=rgba[base]'];
  let last = 'base';
  panels.forEach((panel, i) => {
    const spec = specs[panel.platform];
    args.push('-ss', spec.start.toFixed(3), '-t', (duration + 0.5).toFixed(3), '-i', spec.video);
    const inp = i + 1;
    filters.push(
      `[${inp}:v]fps=${FPS},${cropExpr(spec.crop)},scale=${panel.w}:${panel.h}:flags=lanczos,setsar=1,setpts=PTS-STARTPTS[p${i}]`
    );
    filters.push(`[${last}][p${i}]overlay=${panel.x}:${panel.y}:eof_action=repeat:format=auto[o${i}]`);
    last = `o${i}`;
  });
  args.push('-i', chrome);
  filters.push(`[${last}][${panels.length + 1}:v]overlay=0:0:eof_action=repeat:format=auto,format=yuv420p[v]`);

  const out = path.join(work, `clip-${index}.mp4`);
  ffmpeg([
    ...args,
    '-filter_complex', filters.join(';'),
    '-map', '[v]',
    '-t', duration.toFixed(3),
    '-r', String(FPS),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16',
    out,
  ]);
  return { file: out, duration };
}

function buildCard(index) {
  const png = path.join(work, 'card.png');
  renderHtml({ html: cardHtml(), width: W, height: H, scale: 1, out: png, workDir: work });
  const out = path.join(work, `clip-${index}.mp4`);
  const duration = 2.2;
  ffmpeg([
    '-loop', '1', '-framerate', String(FPS), '-i', png,
    '-t', duration.toFixed(3),
    '-vf', 'format=yuv420p',
    '-r', String(FPS),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16',
    out,
  ]);
  return { file: out, duration };
}

console.log('=== README showreel ===');
const clips = [];
COMPONENTS.forEach((component) => {
  const hasIos = newestRecording('ios', component.test);
  const hasAndroid = component.iosOnly || newestRecording('android', component.test);
  if (!hasIos || !hasAndroid) {
    console.log(`  ${component.name}: skipped (missing recording)`);
    return;
  }
  process.stdout.write(`  ${component.name}...`);
  clips.push(buildClip(component, clips.length));
  console.log(' ok');
});
if (clips.length === 0) {
  console.error('No recordings found under example/artifacts');
  process.exit(1);
}
clips.push(buildCard(clips.length));

// Cross-fade the clips into one master
process.stdout.write('  Joining...');
const master = path.join(work, 'master.mp4');
{
  const args = [];
  clips.forEach((c) => args.push('-i', c.file));
  const filters = [];
  let last = '0:v';
  let elapsed = clips[0].duration;
  for (let i = 1; i < clips.length; i++) {
    const offset = elapsed - XFADE;
    const outLabel = i === clips.length - 1 ? 'v' : `x${i}`;
    filters.push(`[${last}][${i}:v]xfade=transition=fade:duration=${XFADE}:offset=${offset.toFixed(3)}[${outLabel}]`);
    last = outLabel;
    elapsed = offset + clips[i].duration;
  }
  ffmpeg([
    ...args,
    '-filter_complex', filters.join(';'),
    '-map', '[v]',
    '-r', String(FPS),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p',
    master,
  ]);
}
console.log(' ok');

// Outputs
const videoDir = path.join(DOCS_STATIC_DIR, 'video');
fs.mkdirSync(videoDir, { recursive: true });
const mp4 = path.join(videoDir, 'showreel.mp4');
ffmpeg(['-i', master, '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4]);
const poster = path.join(videoDir, 'showreel.jpg');
ffmpeg(['-ss', '0.6', '-i', master, '-frames:v', '1', '-q:v', '4', poster]);

const gifWidth = parseInt(process.env.GIF_WIDTH || '928', 10);
const gif = path.join(ASSETS_DIR, 'showreel.gif');
const palette = path.join(work, 'palette.png');
const pre = `fps=${GIF_FPS},scale=${gifWidth}:-2:flags=lanczos`;
ffmpeg(['-i', master, '-vf', `${pre},palettegen=stats_mode=diff`, palette]);
ffmpeg([
  '-i', master, '-i', palette,
  '-filter_complex', `${pre}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
  gif,
]);

const total = clips.reduce((s, c) => s + c.duration, 0) - XFADE * (clips.length - 1);
console.log(`  ${path.relative(process.cwd(), gif)} (${fmtBytes(fs.statSync(gif).size)}, ${total.toFixed(1)}s, ${clips.length - 1} components)`);
console.log(`  ${path.relative(process.cwd(), mp4)} (${fmtBytes(fs.statSync(mp4).size)})`);
console.log(`  ${path.relative(process.cwd(), poster)} (${fmtBytes(fs.statSync(poster).size)})`);
if (keepWork) console.log(`  work dir: ${work}`);
else fs.rmSync(work, { recursive: true, force: true });
