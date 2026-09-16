// Concatenates every docs page (sidebar order) into static/llms-full.txt so
// coding agents can fetch the whole reference in one request. Runs before
// `docusaurus build`; the file is git-ignored.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const docsDir = join(here, '..', 'docs');
const site = 'https://jarx-concepts.github.io/react-native-platform-components';

const order = [
  'intro',
  'installation',
  'quick-start',
  'components/datepicker',
  'components/contextmenu',
  'components/selectionmenu',
  'components/segmentedcontrol',
  'components/liquidglass',
  'guides/android-theme',
  'guides/icons',
  'guides/theming',
];

const parts = [
  '# react-native-platform-components: full documentation',
  '',
  `Generated from the documentation site (${site}). One section per page.`,
  '',
];

for (const id of order) {
  const raw = readFileSync(join(docsDir, `${id}.md`), 'utf8');
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
  const title = fm?.[1].match(/^title:\s*"?(.*?)"?\s*$/m)?.[1] ?? id;
  const url = `${site}/${id === 'intro' ? '' : id}`;
  const body = raw
    .slice(fm ? fm[0].length : 0)
    // GIF tables are noise for a text consumer
    .replace(/<table>[\s\S]*?<\/table>\s*/g, '')
    .trim();
  parts.push(`\n---\n\n# ${title}\n\nSource: ${url}\n\n${body}\n`);
}

writeFileSync(join(here, '..', 'static', 'llms-full.txt'), parts.join('\n'));
console.log('wrote static/llms-full.txt');
