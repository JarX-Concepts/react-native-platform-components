// ios/PCNativeThemeModule.mm

#import <PlatformComponentsViewSpec/PlatformComponentsViewSpec.h>
#import <React/RCTConvert.h>

#if __has_include(<PlatformComponents/PlatformComponents-Swift.h>)
#import <PlatformComponents/PlatformComponents-Swift.h>
#else
#import "PlatformComponents-Swift.h"
#endif

/// `setNativeTheme` / `useNativeTheme` on iOS. See PCNativeTheme.swift.
@interface PCNativeThemeModule : NSObject <NativePlatformComponentsThemeSpec>
@end

@implementation PCNativeThemeModule

RCT_EXPORT_MODULE(PlatformComponentsTheme)

- (void)setTheme:(NSDictionary *)theme
{
  id primary = theme[@"primary"];
  dispatch_async(dispatch_get_main_queue(), ^{
    // Resolves PlatformColor and DynamicColorIOS values as well as plain colors.
    UIColor *color = primary == nil || primary == [NSNull null] ? nil : [RCTConvert UIColor:primary];
    [PCNativeTheme.shared setPrimaryColor:color];
  });
}

/// The app keeps the iOS 18 design (`UIDesignRequiresCompatibility` in its
/// Info.plist). UIKit then draws no glass: a UIGlassEffect view is an opaque
/// fill, `.glass()` buttons are gray, and a tab bar's bottom accessory isn't
/// shown. iOS 27 ignores the key in apps built with the iOS 27 SDK, and
/// honours it in apps built with the iOS 26 SDK, as iOS 26 always does.
/// Measured on iOS 26.5 and 27.0. The library is compiled with the app, so
/// the SDK it is built with is the app's.
static BOOL PCDesignRequiresCompatibility(void)
{
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 270000
  if (@available(iOS 27.0, *)) {
    return NO;
  }
#endif
  id value = [NSBundle.mainBundle objectForInfoDictionaryKey:@"UIDesignRequiresCompatibility"];
  return [value isKindOfClass:[NSNumber class]] && [value boolValue];
}

/// Reports what this *app* gets, not just what the device runs: with an
/// older Xcode the glass code is compiled out (see PCLiquidGlass.swift), and
/// an app that keeps the iOS 18 design gets no glass, so the iOS version
/// alone would be a false positive.
- (NSNumber *)isLiquidGlassSupported
{
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 260000
  if (@available(iOS 26.0, *)) {
    return @(PCLiquidGlassView.isSupported && !PCDesignRequiresCompatibility());
  }
#endif
  return @NO;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativePlatformComponentsThemeSpecJSI>(params);
}

@end
