// PCFloatingToolbar.mm
//
// A floating toolbar: a capsule of Liquid Glass on iOS 26 (a blur material
// with a soft shadow on earlier versions) hosting the React children.

#import "PCFloatingToolbar.h"

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

@implementation PCFloatingToolbar {
  PCFloatingToolbarView *_view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<PCFloatingToolbarComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    // Fabric views seed _props with their own defaults: RCTViewComponentView
    // asserts on it in debug builds of React Native core, and the first
    // updateProps would otherwise read the base ViewProps as PCFloatingToolbarProps.
    static const auto defaultProps = std::make_shared<const PCFloatingToolbarProps>();
    _props = defaultProps;

    _view = [[PCFloatingToolbarView alloc] initWithFrame:self.bounds];
    _view.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [self addSubview:_view];
  }
  return self;
}

// Mount children into the material's contentView
- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [_view.contentView insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [childComponentView removeFromSuperview];
}

// While the toolbar is slid away (hideOnScroll), the empty space it left
// passes touches to the content underneath
- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event {
  UIView *hit = [super hitTest:point withEvent:event];
  return hit == self && _view.isScrollHidden ? nil : hit;
}

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
  const auto &newProps = *std::static_pointer_cast<const PCFloatingToolbarProps>(props);
  const auto prevProps = std::static_pointer_cast<const PCFloatingToolbarProps>(oldProps);

  // color -> material tint (SharedColor, already processed by React Native)
  if (!prevProps || newProps.color != prevProps->color) {
    _view.tintUIColor = RCTUIColorFromSharedColor(newProps.color);
  }

  // ios.effect: "regular" | "clear"
  const auto &newIos = newProps.ios;
  const auto &oldIos = prevProps ? prevProps->ios : PCFloatingToolbarIosStruct{};
  if (!prevProps || newIos.effect != oldIos.effect) {
    _view.effectStyle = newIos.effect == "clear" ? @"clear" : @"regular";
  }
  if (!prevProps || newIos.interactive != oldIos.interactive) {
    _view.interactive = newIos.interactive;
  }
  if (!prevProps || newIos.scrollEdgeEffect != oldIos.scrollEdgeEffect) {
    _view.scrollEdgeEffect = [NSString stringWithUTF8String:newIos.scrollEdgeEffect.c_str()];
  }

  // The linked ScrollView and hide on scroll
  if (!prevProps || newProps.scrollViewNativeID != prevProps->scrollViewNativeID) {
    _view.scrollViewNativeID = [NSString stringWithUTF8String:newProps.scrollViewNativeID.c_str()];
  }
  if (!prevProps || newProps.hideOnScroll != prevProps->hideOnScroll) {
    _view.hideOnScroll = newProps.hideOnScroll;
  }

  // android.variant: Android only

  [super updateProps:props oldProps:oldProps];
}

@end

Class<RCTComponentViewProtocol> PCFloatingToolbarCls(void) {
  return PCFloatingToolbar.class;
}
