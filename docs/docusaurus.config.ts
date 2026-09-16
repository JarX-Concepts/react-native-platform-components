import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { themes as prismThemes } from 'prism-react-renderer';

const repo = 'https://github.com/JarX-Concepts/react-native-platform-components';

const config: Config = {
  title: 'react-native-platform-components',
  tagline:
    'Native DatePicker, ContextMenu, SelectionMenu, SegmentedControl and LiquidGlass for React Native. Native on Android too.',
  url: 'https://jarx-concepts.github.io',
  baseUrl: '/react-native-platform-components/',
  organizationName: 'JarX-Concepts',
  projectName: 'react-native-platform-components',
  trailingSlash: false,
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  markdown: {
    format: 'detect',
    hooks: { onBrokenMarkdownLinks: 'throw' },
  },
  i18n: { defaultLocale: 'en', locales: ['en'] },
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: `${repo}/tree/main/docs/`,
          showLastUpdateTime: false,
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
        sitemap: { changefreq: 'weekly', priority: 0.5 },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    image: 'https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/ios-segmentedcontrol.gif',
    metadata: [
      {
        name: 'keywords',
        content:
          'react native, native components, date picker, segmented control, material 3, context menu, liquid glass, expo, fabric',
      },
    ],
    colorMode: { respectPrefersColorScheme: true },
    navbar: {
      title: 'react-native-platform-components',
      items: [
        { type: 'docSidebar', sidebarId: 'docs', position: 'left', label: 'Docs' },
        { href: 'https://www.npmjs.com/package/react-native-platform-components', label: 'npm', position: 'right' },
        { href: repo, label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Installation', to: '/installation' },
            { label: 'Quick Start', to: '/quick-start' },
            { label: 'Android Theme Configuration', to: '/guides/android-theme' },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'GitHub', href: repo },
            { label: 'npm', href: 'https://www.npmjs.com/package/react-native-platform-components' },
            { label: 'Issues', href: `${repo}/issues` },
            { label: 'Contributing', href: `${repo}/blob/main/CONTRIBUTING.md` },
          ],
        },
      ],
      copyright: `MIT License. Copyright ${new Date().getFullYear()} Andrew Tosh / JarX Concepts.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'kotlin', 'swift', 'groovy'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
