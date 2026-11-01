// PCProgressIndicator.mm

#import "PCProgressIndicator.h"

#import <React/RCTComponentViewFactory.h>
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>

#import <react/renderer/components/PlatformComponentsViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/PlatformComponentsViewSpec/Props.h>

#if __has_include(<PlatformComponents/PlatformComponents-Swift.h>)
#import <PlatformComponents/PlatformComponents-Swift.h>
#else
#import "PlatformComponents-Swift.h"
#endif

using namespace facebook::react;

namespace {
static inline NSString *NSStringFromStd(const std::string &s, NSString *fallback) {
  return s.empty() ? fallback : [NSString stringWithUTF8String:s.c_str()];
}
} // namespace

// This view is the accessibility element: React Native puts the testID,
// label, role and value on it, and the UIKit controls inside are hidden from
// accessibility, so by.id(...) finds the element with the label and value.
@implementation PCProgressIndicator {
  PCProgressIndicatorView *_view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<PCProgressIndicatorComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    // Fabric views seed _props with their own defaults (see PCLiquidGlass.mm)
    static const auto defaultProps = std::make_shared<const PCProgressIndicatorProps>();
    _props = defaultProps;

    _view = [[PCProgressIndicatorView alloc] initWithFrame:self.bounds];
    _view.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [self addSubview:_view];
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps {
  const auto &newProps = *std::static_pointer_cast<const PCProgressIndicatorProps>(props);
  const auto prevProps = std::static_pointer_cast<const PCProgressIndicatorProps>(oldProps);

  if (!prevProps || newProps.variant != prevProps->variant) {
    _view.variant = NSStringFromStd(newProps.variant, @"linear");
  }
  if (!prevProps || newProps.progress != prevProps->progress) {
    _view.progress = newProps.progress;
  }
  // Colors arrive as SharedColor (already processed by React Native)
  if (!prevProps || newProps.color != prevProps->color) {
    _view.indicatorColor = RCTUIColorFromSharedColor(newProps.color);
  }
  if (!prevProps || newProps.trackColor != prevProps->trackColor) {
    _view.trackColor = RCTUIColorFromSharedColor(newProps.trackColor);
  }
  if (!prevProps || newProps.size != prevProps->size) {
    _view.size = NSStringFromStd(newProps.size, @"");
  }
  if (!prevProps || newProps.segments != prevProps->segments) {
    _view.segments = newProps.segments;
  }
  // android.wavy has no iOS counterpart

  [_view commit];

  [super updateProps:props oldProps:oldProps];
}

@end

Class<RCTComponentViewProtocol> PCProgressIndicatorCls(void) {
  return PCProgressIndicator.class;
}
