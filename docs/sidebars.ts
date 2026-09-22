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
        'components/datepicker',
        'components/contextmenu',
        'components/selectionmenu',
        'components/segmentedcontrol',
        'components/button',
        'components/buttongroup',
        'components/floatingtoolbar',
        'components/textfield',
        'components/liquidglass',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: ['guides/android-theme', 'guides/icons', 'guides/theming'],
    },
  ],
};

export default sidebars;
