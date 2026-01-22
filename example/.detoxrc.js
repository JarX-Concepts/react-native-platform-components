/** @type {Detox.DetoxConfig} */
module.exports = {
  logger: {
    level: 'info',
  },

  artifacts: {
    rootDir: 'artifacts',
    plugins: {
      // record a .mp4 per test
      video: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: false,
      },
      // optional but very useful alongside video
      screenshot: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: false,
      },
      log: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: false,
      },
    },
  },

  testRunner: {
    args: {
      $0: 'yarn',
      _: ['jest:e2e'],
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath:
        'ios/build/Build/Products/Debug-iphonesimulator/PlatformComponentsExample.app',
      build:
        'xcodebuild -workspace ios/PlatformComponentsExample.xcworkspace -scheme PlatformComponentsExample -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath:
        'ios/build/Build/Products/Release-iphonesimulator/PlatformComponentsExample.app',
      build:
        'xcodebuild -workspace ios/PlatformComponentsExample.xcworkspace -scheme PlatformComponentsExample -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build:
        'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081],
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build:
        'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 17 Pro Max',
      },
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_9_API_35',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'android.att.debug': {
      device: 'attached',
      app: 'android.debug',
    },
    'android.att.release': {
      device: 'attached',
      app: 'android.release',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release',
    },
  },
};
