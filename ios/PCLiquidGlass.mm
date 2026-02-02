// PCLiquidGlass.mm

#import "PCLiquidGlass.h"

#import <React/RCTComponentViewFactory.h>
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>

#import <react/renderer/components/PlatformComponentsViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#import <react/renderer/components/PlatformComponentsViewSpec/Props.h>

#if __has_include(<PlatformComponents/PlatformComponents-Swift.h>)
#import <PlatformComponents/PlatformComponents-Swift.h>
#else
#import "PlatformComponents-Swift.h"
#endif

using namespace facebook::react;

@implementation PCLiquidGlass {
  PCLiquidGlassView *_view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<PCLiquidGlassComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    _view = [[PCLiquidGlassView alloc] initWithEffect:nil];
    self.contentView = _view;

    // Set up press callback
    __weak __typeof(self) weakSelf = self;
    _view.onPressCallback = ^(CGFloat x, CGFloat y) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCLiquidGlassEventEmitter>(
              strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      PCLiquidGlassEventEmitter::OnGlassPress payload = {
          .x = (float)x,
          .y = (float)y,
      };
      eventEmitter->onGlassPress(payload);
    };
  }
  return self;
}

// Mount children into the UIVisualEffectView's contentView
- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [_view.contentView insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [childComponentView removeFromSuperview];
}


- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
  const auto &newProps =
      *std::static_pointer_cast<const PCLiquidGlassProps>(props);
  const auto prevProps =
      std::static_pointer_cast<const PCLiquidGlassProps>(oldProps);

  BOOL needsSetup = NO;

  // cornerRadius -> glassCornerRadius
  if (!prevProps || newProps.cornerRadius != prevProps->cornerRadius) {
    _view.glassCornerRadius = newProps.cornerRadius;
  }

  // iOS-specific props
  const auto &newIos = newProps.ios;
  const auto &oldIos = prevProps ? prevProps->ios : PCLiquidGlassIosStruct{};

  // interactive - needs setup to re-create effect with isInteractive
  if (!prevProps || newIos.interactive != oldIos.interactive) {
    _view.interactive = (newIos.interactive == "true");
    needsSetup = YES;
  }

  // effect -> effectStyle
  if (!prevProps || newIos.effect != oldIos.effect) {
    if (!newIos.effect.empty()) {
      _view.effectStyle = [NSString stringWithUTF8String:newIos.effect.c_str()];
    } else {
      _view.effectStyle = @"regular";
    }
    needsSetup = YES;
  }

  // tintColor -> glassTintColor
  if (!prevProps || newIos.tintColor != oldIos.tintColor) {
    if (!newIos.tintColor.empty()) {
      _view.glassTintColor = [NSString stringWithUTF8String:newIos.tintColor.c_str()];
    } else {
      _view.glassTintColor = nil;
    }
    needsSetup = YES;
  }

  // colorScheme
  if (!prevProps || newIos.colorScheme != oldIos.colorScheme) {
    if (!newIos.colorScheme.empty()) {
      _view.colorScheme = [NSString stringWithUTF8String:newIos.colorScheme.c_str()];
    } else {
      _view.colorScheme = @"system";
    }
    needsSetup = YES;
  }

  // Apply glass effect if any glass-related props changed
  if (needsSetup) {
    [_view setupView];
  }

  [super updateProps:props oldProps:oldProps];
}

@end

Class<RCTComponentViewProtocol> PCLiquidGlassCls(void) {
  return PCLiquidGlass.class;
}
