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

/// Reports what this *build* can do, not just what the device runs: with an
/// older Xcode the glass code is compiled out (see PCLiquidGlass.swift), so
/// the iOS version alone would be a false positive.
- (NSNumber *)isLiquidGlassSupported
{
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 260000
  if (@available(iOS 26.0, *)) {
    return @(PCLiquidGlassView.isSupported);
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
