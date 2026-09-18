/**
 * `isLiquidGlassSupported` has to describe the build, not just the device: a
 * library compiled with an Xcode older than the iOS 26 SDK has the glass code
 * compiled out (see PCLiquidGlass.swift), and then even an iOS 26 device only
 * gets the blur fallback.
 */
jest.mock('../LiquidGlassNativeComponent', () => ({
  __esModule: true,
  default: 'PCLiquidGlass',
}));

type NativeModuleMock = { isLiquidGlassSupported: () => boolean } | null;

function loadFlag(
  platform: { OS: string; Version: string | number },
  nativeModule: NativeModuleMock
): boolean {
  let supported = false;
  jest.isolateModules(() => {
    // Only Platform is needed at import time, and requiring the real
    // react-native index here pulls in native modules jest cannot provide.
    jest.doMock('react-native', () => ({ Platform: platform }));
    jest.doMock('../NativePlatformComponentsTheme', () => ({
      __esModule: true,
      default: nativeModule,
    }));
    supported = require('../LiquidGlass').isLiquidGlassSupported;
  });
  return supported;
}

const glassAvailable = { isLiquidGlassSupported: () => true };
const glassCompiledOut = { isLiquidGlassSupported: () => false };

describe('isLiquidGlassSupported', () => {
  it('is true when the build reports glass support', () => {
    expect(loadFlag({ OS: 'ios', Version: '26.0' }, glassAvailable)).toBe(true);
  });

  it('is false on iOS 26 when the build was made without the iOS 26 SDK', () => {
    expect(loadFlag({ OS: 'ios', Version: '26.0' }, glassCompiledOut)).toBe(
      false
    );
  });

  it('is false on Android without consulting the native module', () => {
    const native = { isLiquidGlassSupported: jest.fn(() => true) };
    expect(loadFlag({ OS: 'android', Version: 36 }, native)).toBe(false);
    expect(native.isLiquidGlassSupported).not.toHaveBeenCalled();
  });

  it('falls back to the OS version when the native module is missing', () => {
    expect(loadFlag({ OS: 'ios', Version: '26.0' }, null)).toBe(true);
    expect(loadFlag({ OS: 'ios', Version: '18.4' }, null)).toBe(false);
  });

  it('falls back to the OS version when the native call throws', () => {
    const throwing = {
      isLiquidGlassSupported: () => {
        throw new Error('TurboModule not ready');
      },
    };
    expect(loadFlag({ OS: 'ios', Version: '26.0' }, throwing)).toBe(true);
    expect(loadFlag({ OS: 'ios', Version: '15.1' }, throwing)).toBe(false);
  });
});
