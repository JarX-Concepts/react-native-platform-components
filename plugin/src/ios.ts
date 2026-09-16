import {
  IOSConfig,
  withDangerousMod,
  withXcodeProject,
  type ConfigPlugin,
  type XcodeProject,
} from '@expo/config-plugins';
import fs from 'fs';
import path from 'path';

/** Hex accent color, with an optional dark mode variant. */
export type AccentColor = { light: string; dark?: string };

export const ACCENT_COLOR_SET_NAME = 'AccentColor';

function colorSetColor(hex: string) {
  return {
    'color-space': 'srgb',
    'components': {
      red: `0x${hex.slice(1, 3)}`,
      green: `0x${hex.slice(3, 5)}`,
      blue: `0x${hex.slice(5, 7)}`,
      alpha: '1.000',
    },
  };
}

/** `Contents.json` of the `AccentColor.colorset` asset. */
export function accentColorSetContents({ light, dark }: AccentColor) {
  return {
    colors: [
      { color: colorSetColor(light), idiom: 'universal' },
      ...(dark
        ? [
            {
              appearances: [{ appearance: 'luminosity', value: 'dark' }],
              color: colorSetColor(dark),
              idiom: 'universal',
            },
          ]
        : []),
    ],
    info: { author: 'xcode', version: 1 },
  };
}

/**
 * Sets the app target's Global Accent Color Name build setting, which makes
 * the color set UIKit's default tint color.
 */
export function setGlobalAccentColorName(
  project: XcodeProject,
  projectName: string
): XcodeProject {
  const { target } = IOSConfig.XcodeUtils.getApplicationNativeTarget({
    project,
    projectName,
  });
  const buildConfigs = IOSConfig.XcodeUtils.getBuildConfigurationsForListId(
    project,
    target.buildConfigurationList
  );
  for (const [, buildConfig] of buildConfigs) {
    buildConfig.buildSettings.ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME =
      ACCENT_COLOR_SET_NAME;
  }
  return project;
}

/**
 * Writes `AccentColor.colorset` into the app's asset catalog and makes it the
 * global accent color, the same setup a new Xcode project starts with.
 */
export const withIosAccentColor: ConfigPlugin<AccentColor> = (
  config,
  accentColor
) => {
  config = withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      const colorSetDir = path.join(
        IOSConfig.Paths.getSourceRoot(modConfig.modRequest.projectRoot),
        'Images.xcassets',
        `${ACCENT_COLOR_SET_NAME}.colorset`
      );
      await fs.promises.mkdir(colorSetDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(colorSetDir, 'Contents.json'),
        `${JSON.stringify(accentColorSetContents(accentColor), null, 2)}\n`
      );
      return modConfig;
    },
  ]);

  return withXcodeProject(config, (modConfig) => {
    modConfig.modResults = setGlobalAccentColorName(
      modConfig.modResults,
      modConfig.modRequest.projectName!
    );
    return modConfig;
  });
};
