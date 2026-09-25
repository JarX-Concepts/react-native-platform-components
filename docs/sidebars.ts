import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    'installation',
    'quick-start',
    {
      type: 'category',
      label: 'Components',
      collapsed: false,
      items: [
        'components/textfield',
        'components/datepicker',
        'components/contextmenu',
        'components/selectionmenu',
        'components/segmentedcontrol',
        'components/tabbar',
        'components/navigationrail',
        'components/button',
        'components/buttongroup',
        'components/floatingtoolbar',
        'components/liquidglass',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: [
        'guides/android-theme',
        'guides/icons',
        'guides/theming',
        'guides/testing',
        'guides/web',
      ],
    },
  ],
};

export default sidebars;
