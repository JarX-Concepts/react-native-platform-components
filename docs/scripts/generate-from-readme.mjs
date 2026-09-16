// Generates the docs pages from the root README so the two never drift.
// Run from docs/: `yarn generate` (or `yarn docs generate` from the repo root).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const readmePath = process.argv[2] ?? join(here, '..', '..', 'README.md');
const outDir = join(here, '..', 'docs');
const repo = 'https://github.com/JarX-Concepts/react-native-platform-components';

// Page -> README h2 sections it is built from (first one supplies the body; its
// own heading is dropped because the frontmatter title replaces it).
const pages = [
  { file: 'intro.md', slug: '/', title: 'Overview', sidebar: 'Overview', sections: ['__top__', 'Why this library'],
    description: 'Native DatePicker, ContextMenu, SelectionMenu, SegmentedControl and LiquidGlass for React Native, native on iOS and Android.' },
  { file: 'installation.md', title: 'Installation', sections: ['Installation', 'React Native New Architecture'],
    description: 'Install react-native-platform-components in a bare React Native or Expo app (New Architecture, dev client, config plugin).' },
  { file: 'quick-start.md', title: 'Quick Start', sections: ['Quick Start'],
    description: 'Copy-paste examples for every component: DatePicker, ContextMenu, SelectionMenu, SegmentedControl and LiquidGlass.' },
  { file: 'components/datepicker.md', title: 'DatePicker', sections: ['DatePicker'],
    description: 'Native date and time picker for React Native: UIDatePicker on iOS, MaterialDatePicker and MaterialTimePicker on Android.' },
  { file: 'components/contextmenu.md', title: 'ContextMenu', sections: ['ContextMenu'],
    description: 'Native context menu for React Native: UIContextMenuInteraction on iOS, PopupMenu on Android, with icons.' },
  { file: 'components/selectionmenu.md', title: 'SelectionMenu', sections: ['SelectionMenu'],
    description: 'Native selection menu for React Native: system menus on iOS, Material exposed dropdown or Spinner on Android.' },
  { file: 'components/segmentedcontrol.md', title: 'SegmentedControl', sections: ['SegmentedControl'],
    description: 'Native segmented control for React Native: UISegmentedControl on iOS, Material 3 segmented buttons on Android, with icons and badges.' },
  { file: 'components/liquidglass.md', title: 'LiquidGlass', sections: ['LiquidGlass'],
    description: 'Liquid glass for React Native: UIGlassEffect on iOS 26 with a fallback View on Android and older iOS.' },
  { file: 'guides/android-theme.md', title: 'Android Theme Configuration', sections: ['Android Theme Configuration'],
    description: 'How the Android components use your Material 3 theme, what happens under an AppCompat theme, and the Expo plugin option.' },
  { file: 'guides/icons.md', title: 'Icons', sections: ['Icons'],
    description: 'SF Symbols on iOS and drawables or images on Android for ContextMenu and SegmentedControl icons.' },
  { file: 'guides/theming.md', title: 'Theming and Colors', sections: ['Design Philosophy', 'Theming', 'Color Formats'],
    description: 'Design philosophy, theming, and the color formats accepted by react-native-platform-components.' },
];

const readme = readFileSync(readmePath, 'utf8');

// Split README into h2 sections.
const sections = new Map();
let current = '__top__';
let buf = [];
let inFence = false;
for (const line of readme.split('\n')) {
  if (line.startsWith('```')) inFence = !inFence;
  if (!inFence && line.startsWith('## ')) {
    sections.set(current, buf.join('\n'));
    current = line.slice(3).trim();
    buf = [];
    continue;
  }
  buf.push(line);
}
sections.set(current, buf.join('\n'));

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9 _-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

// Anchor -> page path, so README-internal links become cross-page links.
const anchorToPage = new Map();
// The first section's heading becomes the page title, so links to it target the page itself.
const pageTitleAnchors = new Set();
const pagePath = (p) => (p.slug ? p.slug : '/' + p.file.replace(/\.md$/, ''));
for (const page of pages) {
  const path = pagePath(page);
  for (const [i, name] of page.sections.entries()) {
    if (name !== '__top__') anchorToPage.set(slugify(name), path);
    if (i === 0 && name !== '__top__') pageTitleAnchors.add(slugify(name));
    const body = sections.get(name);
    if (body == null) throw new Error(`README section not found: ${name}`);
    let fence = false;
    for (const line of body.split('\n')) {
      if (line.startsWith('```')) fence = !fence;
      const m = !fence && line.match(/^#{2,4}\s+(.*)$/);
      if (m) anchorToPage.set(slugify(m[1]), path);
    }
  }
}

function transform(body, path) {
  let out = body
    // drop the README h1 and badge lines
    .replace(/^# .*\n/m, '')
    .replace(/^\[!\[.*\n/gm, '')
    // "---" separators between README sections are noise on a page
    .replace(/\n---\n\s*$/g, '\n');
  // cross-page anchors
  out = out.replace(/\]\(#([a-z0-9-]+)\)/g, (m, anchor) => {
    const target = anchorToPage.get(anchor);
    if (!target) return `](${repo}#${anchor})`;
    if (pageTitleAnchors.has(anchor)) return `](${target})`;
    return target === path ? m : `](${target}#${anchor})`;
  });
  // relative repo links
  out = out.replace(/\]\((?:\.\/)?((?!https?:|#|mailto:|\/)[A-Za-z0-9_./-]+)\)/g, (m, rel) => {
    const isDir = !/\.[a-z]+$/i.test(rel);
    return `](${repo}/${isDir ? 'tree' : 'blob'}/main/${rel.replace(/\/$/, '')})`;
  });
  return out.trim() + '\n';
}

for (const page of pages) {
  const path = pagePath(page);
  const parts = page.sections.map((name, i) => {
    const body = transform(sections.get(name), path);
    return i === 0 ? body : `## ${name}\n\n${body}`;
  });
  const fm = [
    '---',
    `title: ${JSON.stringify(page.title)}`,
    page.sidebar ? `sidebar_label: ${JSON.stringify(page.sidebar)}` : null,
    page.slug ? `slug: ${page.slug}` : null,
    `description: ${JSON.stringify(page.description)}`,
    '---',
    '',
    '<!-- Generated from the root README by docs/scripts/generate-from-readme.mjs. Edit the README, then run `yarn docs generate`. -->',
    '',
    '',
  ].filter((l) => l !== null).join('\n');
  const target = join(outDir, page.file);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, fm + parts.join('\n'));
  console.log('wrote', page.file);
}
