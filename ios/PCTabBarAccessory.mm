// PCTabBarAccessory.mm

#import "PCTabBarAccessory.h"

#import <React/RCTFabricComponentsPlugins.h>

#import <react/renderer/components/PlatformComponentsViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/PlatformComponentsViewSpec/Props.h>

#if __has_include(<PlatformComponents/PlatformComponents-Swift.h>)
#import <PlatformComponents/PlatformComponents-Swift.h>
#else
#import "PlatformComponents-Swift.h"
#endif

using namespace facebook::react;

/// A TabBar accessory's content. The React children mount into a content
/// view that the TabBar with the same accessoryID moves into UIKit's bottom
/// accessory (iOS 26); this view stays behind as an empty placeholder, laid
/// out where the accessory shows so that the children's layout matches it.
@implementation PCTabBarAccessory {
  PCTabBarAccessoryView *_content;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<PCTabBarAccessoryComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    // Fabric views seed _props with their own defaults: RCTViewComponentView
    // asserts on it in debug builds of React Native core, and the first
    // updateProps would otherwise read the base ViewProps as these props.
    static const auto defaultProps = std::make_shared<const PCTabBarAccessoryProps>();
    _props = defaultProps;

    _content = [PCTabBarAccessoryView new];
    _content.home = self;
    [self addSubview:_content];
  }
  return self;
}

// The children live in the content view, wherever it is
- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [_content insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [childComponentView removeFromSuperview];
}

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
  const auto &newProps = *std::static_pointer_cast<const PCTabBarAccessoryProps>(props);
  const auto prevProps = std::static_pointer_cast<const PCTabBarAccessoryProps>(oldProps);

  [super updateProps:props oldProps:oldProps];

  if (!prevProps || newProps.accessoryID != prevProps->accessoryID) {
    _content.accessoryID = newProps.accessoryID.empty()
        ? @""
        : [NSString stringWithUTF8String:newProps.accessoryID.c_str()];
  }
}

- (void)layoutSubviews {
  [super layoutSubviews];
  if (_content.superview == self) {
    _content.frame = self.bounds;
  }
}

/// While hosted, this view is an empty stand-in over the real accessory;
/// touches go through to it.
- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event {
  if (_content.superview != self) return nil;
  return [super hitTest:point withEvent:event];
}

- (void)prepareForRecycle {
  [super prepareForRecycle];
  // Unlinking tells the bar to let go of the content first
  _content.accessoryID = @"";
  [_content returnHome];
}

@end

Class<RCTComponentViewProtocol> PCTabBarAccessoryCls(void) {
  return PCTabBarAccessory.class;
}
