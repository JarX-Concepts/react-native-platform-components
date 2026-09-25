// Shared helpers for the README visuals: locating Detox recordings, running
// ffmpeg, and rendering HTML to PNG with headless Chrome.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);
export const ASSETS_DIR = path.join(PROJECT_DIR, 'assets');
export const DOCS_STATIC_DIR = path.join(PROJECT_DIR, 'docs', 'static');
export const ARTIFACTS_DIR = path.join(PROJECT_DIR, 'example', 'artifacts');

export const CONFIG_PREFIX = { ios: 'ios.sim.release', android: 'android.emu.release' };

export function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function run(cmd, args, { quiet = true } = {}) {
  const result = spawnSync(cmd, args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
  if (result.status !== 0) {
    const detail = quiet ? `\n${(result.stderr || '').slice(-4000)}` : '';
    throw new Error(`${cmd} ${args.join(' ')} failed (${result.status})${detail}`);
  }
  return result.stdout ?? '';
}

export function ffmpeg(args) {
  return run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
}

/** Width, height and duration of a video file. */
export function probe(file) {
  const out = execFileSync(
    'ffprobe',
    [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height:format=duration',
      '-of', 'json',
      file,
    ],
    { encoding: 'utf8' }
  );
  const json = JSON.parse(out);
  return {
    width: json.streams[0].width,
    height: json.streams[0].height,
    duration: parseFloat(json.format.duration),
  };
}

/**
 * The newest passing recording of a Detox flow across every artifacts run
 * (single-flow runs count), or null.
 */
export function newestRecording(platform, testName) {
  const prefix = CONFIG_PREFIX[platform];
  const wanted = `✓ Platform Components Example should test ${testName} functionality`;
  if (!fs.existsSync(ARTIFACTS_DIR)) return null;
  const candidates = [];
  for (const runDir of fs.readdirSync(ARTIFACTS_DIR)) {
    if (!runDir.startsWith(`${prefix}.`)) continue;
    const file = path.join(ARTIFACTS_DIR, runDir, wanted, 'test.mp4');
    if (fs.existsSync(file)) {
      candidates.push({ file, mtime: fs.statSync(file).mtimeMs });
    }
  }
  candidates.sort((a, b) => b.mtime - a.mtime);
  return candidates[0]?.file ?? null;
}

/**
 * Seconds to the largest scene change between `from` and `window` seconds
 * into a recording (the switch from the launch screen to the demo), plus a
 * short margin. Mirrors navigation_trim in scripts/generate-readme-gifs.sh.
 */
export function navigationTrim(file, window = 12, from = 1.5) {
  const result = spawnSync(
    'ffmpeg',
    [
      '-hide_banner', '-t', String(window), '-i', file,
      '-vf', `select='gt(scene,0.01)*gte(t,${from})',metadata=print:key=lavfi.scene_score`,
      '-f', 'null', '-',
    ],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  );
  const log = `${result.stdout}\n${result.stderr}`;
  let best = -1;
  let at = null;
  const re = /pts_time:([0-9.]+)[\s\S]*?lavfi\.scene_score=([0-9.]+)/g;
  let m;
  while ((m = re.exec(log))) {
    const score = parseFloat(m[2]);
    if (score > best) {
      best = score;
      at = parseFloat(m[1]);
    }
  }
  return at == null ? 3 : at + 0.4;
}

/** ffmpeg crop expression for a fractional rectangle of the frame. */
export function cropExpr(crop) {
  const { x = 0, y = 0, w = 1, h = 1 } = crop;
  return `crop=floor(iw*${w}/2)*2:floor(ih*${h}/2)*2:iw*${x}:ih*${y}`;
}

/** Extract one frame of a recording, cropped, as PNG. */
export function extractFrame({ input, time, crop, out, scale }) {
  const filters = [cropExpr(crop)];
  if (scale) filters.push(`scale=${scale}:-2:flags=lanczos`);
  ffmpeg(['-ss', String(time), '-i', input, '-frames:v', '1', '-vf', filters.join(','), out]);
  return out;
}

function findChrome() {
  if (process.env.CHROME && fs.existsSync(process.env.CHROME)) return process.env.CHROME;
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  for (const name of ['google-chrome', 'chromium', 'chromium-browser', 'chrome']) {
    const r = spawnSync('which', [name], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  }
  throw new Error(
    'No Chrome or Chromium found. Install Google Chrome or set CHROME=/path/to/chrome.'
  );
}

let chromeProfile = null;

/**
 * Render an HTML document to a PNG with headless Chrome. `width` and `height`
 * are CSS pixels; the PNG is `scale` times larger. With `transparent`, the
 * page background is transparent (for overlays).
 */
export function renderHtml({ html, width, height, scale = 2, out, transparent = false, workDir }) {
  const chrome = findChrome();
  const dir = workDir ?? makeTempDir('rnpc-render-');
  if (!chromeProfile) chromeProfile = makeTempDir('rnpc-chrome-profile-');
  const page = path.join(dir, `${path.basename(out, '.png')}.html`);
  fs.writeFileSync(page, html);
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--allow-file-access-from-files',
    `--user-data-dir=${chromeProfile}`,
    `--force-device-scale-factor=${scale}`,
    `--window-size=${width},${height}`,
    '--timeout=8000',
    `--screenshot=${out}`,
  ];
  if (transparent) args.push('--default-background-color=00000000');
  args.push(`file://${page}`);
  if (fs.existsSync(out)) fs.unlinkSync(out);
  // Chrome's new headless mode occasionally lingers after the screenshot is
  // written, so give it a deadline and judge by the output file.
  const result = spawnSync(chrome, args, { encoding: 'utf8', timeout: 30000, killSignal: 'SIGKILL' });
  if (!fs.existsSync(out)) {
    throw new Error(`Chrome did not write ${out}\n${(result.stderr || '').slice(-2000)}`);
  }
  return out;
}

export function fileUrl(p) {
  return `file://${p}`;
}

export function fmtBytes(n) {
  if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(n / 1024)} KB`;
}

/** The font stack shared by every rendered still, so they match each other. */
export const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
