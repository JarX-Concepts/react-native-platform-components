// PCLiquidGlassContainer.mm

#import "PCLiquidGlassContainer.h"

#import <React/RCTComponentViewFactory.h>
#import <React/RCTFabricComponentsPlugins.h>

#import <react/renderer/components/PlatformComponentsViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/PlatformComponentsViewSpec/Props.h>

#if __has_include(<PlatformComponents/PlatformComponents-Swift.h>)
#import <PlatformComponents/PlatformComponents-Swift.h>
#else
#import "PlatformComponents-Swift.h"
#endif

using namespace facebook::react;

@implementation PCLiquidGlassContainer {
  PCLiquidGlassContainerView *_view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<PCLiquidGlassContainerComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const PCLiquidGlassContainerProps>();
    _props = defaultProps;

    _view = [[PCLiquidGlassContainerView alloc] initWithEffect:nil];
    _view.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [self addSubview:_view];
  }
  return self;
}

// Children go in the effect view's contentView, where the container effect
// renders their glass together
- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [_view.contentView insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [childComponentView removeFromSuperview];
}

// On screen, a new size animates with the glass inside it: the container
// clips the merged glass to about its bounds, and glass morphing into a
// smaller container would otherwise be cut off
- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics {
  BOOL morphs = oldLayoutMetrics != EmptyLayoutMetrics &&
      layoutMetrics.frame.size != oldLayoutMetrics.frame.size && _view.isSettled;
  if (!morphs) {
    [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
    return;
  }
  [PCLiquidGlassView morph:^{
    [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
    [self layoutIfNeeded];
  }];
}

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
  const auto &newProps =
      *std::static_pointer_cast<const PCLiquidGlassContainerProps>(props);
  const auto prevProps =
      std::static_pointer_cast<const PCLiquidGlassContainerProps>(oldProps);

  if (!prevProps || newProps.spacing != prevProps->spacing) {
    _view.spacing = newProps.spacing;
  }

  [super updateProps:props oldProps:oldProps];
}

@end

Class<RCTComponentViewProtocol> PCLiquidGlassContainerCls(void) {
  return PCLiquidGlassContainer.class;
}
