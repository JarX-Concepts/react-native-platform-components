// PCTabBar.mm

#import "PCTabBar.h"

#import <React/RCTComponentViewFactory.h>
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>
#import <React/RCTFont.h>

#import <react/renderer/components/PlatformComponentsViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#import <react/renderer/components/PlatformComponentsViewSpec/Props.h>
#import <react/renderer/core/LayoutPrimitives.h>

#if __has_include(<PlatformComponents/PlatformComponents-Swift.h>)
#import <PlatformComponents/PlatformComponents-Swift.h>
#else
#import "PlatformComponents-Swift.h"
#endif

#import "PCTabBarComponentDescriptors-custom.h"
#import "PCTabBarShadowNode-custom.h"
#import "PCTabBarState-custom.h"

using namespace facebook::react;

namespace {
static inline bool ItemsEqual(
    const std::vector<PCTabBarItemsStruct> &a,
    const std::vector<PCTabBarItemsStruct> &b) {
  if (a.size() != b.size()) return false;
  for (size_t i = 0; i < a.size(); i++) {
    const auto &x = a[i];
    const auto &y = b[i];
    if (x.label != y.label || x.value != y.value || x.disabled != y.disabled ||
        x.iconType != y.iconType || x.iconName != y.iconName || x.iconUri != y.iconUri ||
        x.iconScale != y.iconScale || x.iconTinted != y.iconTinted ||
        x.selectedIconType != y.selectedIconType || x.selectedIconName != y.selectedIconName ||
        x.selectedIconUri != y.selectedIconUri || x.selectedIconScale != y.selectedIconScale ||
        x.selectedIconTinted != y.selectedIconTinted || x.badge != y.badge ||
        x.accessibilityLabel != y.accessibilityLabel || x.testID != y.testID ||
        x.role != y.role || x.systemItem != y.systemItem) {
      return false;
    }
  }
  return true;
}

static inline NSString *NSStringFromStd(const std::string &s, NSString *fallback) {
  return s.empty() ? fallback : [NSString stringWithUTF8String:s.c_str()];
}

static inline bool LabelStyleEqual(
    const PCTabBarLabelStyleStruct &a,
    const PCTabBarLabelStyleStruct &b) {
  return a.fontFamily == b.fontFamily && a.fontSize == b.fontSize &&
         a.fontWeight == b.fontWeight && a.fontStyle == b.fontStyle;
}

/// Builds the label font from RN-style font props, or nil when every field is
/// unset so the bar keeps the system font.
static UIFont *FontFromLabelStyle(const PCTabBarLabelStyleStruct &style) {
  if (style.fontFamily.empty() && style.fontSize <= 0 &&
      style.fontWeight.empty() && style.fontStyle.empty()) {
    return nil;
  }
  // Tab bar titles default to 10pt medium; start there so a lone fontWeight
  // or fontStyle doesn't change the size.
  return [RCTFont updateFont:[UIFont systemFontOfSize:10 weight:UIFontWeightMedium]
                  withFamily:NSStringFromStd(style.fontFamily, nil)
                        size:style.fontSize > 0 ? @(style.fontSize) : nil
                      weight:NSStringFromStd(style.fontWeight, nil)
                       style:NSStringFromStd(style.fontStyle, nil)
                     variant:nil
             scaleMultiplier:1.0];
}
} // namespace

@interface PCTabBar ()

- (void)updateMeasurements;

@end

@implementation PCTabBar {
  PCTabBarView *_view;
  MeasuringPCTabBarShadowNode::ConcreteState::Shared _state;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<MeasuringPCTabBarComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    // Fabric views seed _props with their own defaults: RCTViewComponentView
    // asserts on it in debug builds of React Native core, and the first
    // updateProps would otherwise read the base ViewProps as PCTabBarProps.
    static const auto defaultProps = std::make_shared<const PCTabBarProps>();
    _props = defaultProps;

    _view = [PCTabBarView new];
    self.contentView = _view;

    __weak __typeof(self) weakSelf = self;

    _view.onTabPress = ^(NSInteger index, NSString *value, BOOL reselected) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      [strongSelf->_view.haptics performIn:strongSelf->_view];

      auto eventEmitter =
          std::static_pointer_cast<const PCTabBarEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      PCTabBarEventEmitter::OnTabPress payload = {
          .index = (int)index,
          .value = value.UTF8String,
          .reselected = reselected ? "true" : "false",
      };
      eventEmitter->onTabPress(payload);
    };

    _view.onNeedsRemeasure = ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;
      [strongSelf updateMeasurements];
    };

    _view.onAccessoryLayout = ^(CGRect frame, NSString *environment) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCTabBarEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      PCTabBarEventEmitter::OnAccessoryLayout payload = {
          .x = frame.origin.x,
          .y = frame.origin.y,
          .width = frame.size.width,
          .height = frame.size.height,
          .environment = environment.UTF8String,
      };
      eventEmitter->onAccessoryLayout(payload);
    };
  }
  return self;
}

/// Only the bar and its accessory take touches: the empty room around them
/// (above a minimized bar, beside the accessory) passes them on to the
/// content behind.
- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event {
  UIView *hit = [super hitTest:point withEvent:event];
  return hit == self ? nil : hit;
}

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
  const auto &newProps = *std::static_pointer_cast<const PCTabBarProps>(props);
  const auto prevProps = std::static_pointer_cast<const PCTabBarProps>(oldProps);

  // labelVisibility before the items, which are built for it
  if (!prevProps || newProps.labelVisibility != prevProps->labelVisibility) {
    _view.labelVisibility = NSStringFromStd(newProps.labelVisibility, @"auto");
  }

  if (!prevProps || !ItemsEqual(newProps.items, prevProps->items)) {
    NSMutableArray *arr = [NSMutableArray new];
    for (const auto &item : newProps.items) {
      [arr addObject:@{
        @"label" : NSStringFromStd(item.label, @""),
        @"value" : NSStringFromStd(item.value, @""),
        @"disabled" : NSStringFromStd(item.disabled, @"enabled"),
        @"iconType" : NSStringFromStd(item.iconType, @""),
        @"iconName" : NSStringFromStd(item.iconName, @""),
        @"iconUri" : NSStringFromStd(item.iconUri, @""),
        @"iconScale" : @(item.iconScale),
        @"iconTinted" : NSStringFromStd(item.iconTinted, @"true"),
        @"selectedIconType" : NSStringFromStd(item.selectedIconType, @""),
        @"selectedIconName" : NSStringFromStd(item.selectedIconName, @""),
        @"selectedIconUri" : NSStringFromStd(item.selectedIconUri, @""),
        @"selectedIconScale" : @(item.selectedIconScale),
        @"selectedIconTinted" : NSStringFromStd(item.selectedIconTinted, @"true"),
        @"badge" : NSStringFromStd(item.badge, @""),
        @"accessibilityLabel" : NSStringFromStd(item.accessibilityLabel, @""),
        @"testID" : NSStringFromStd(item.testID, @""),
        @"role" : NSStringFromStd(item.role, @""),
        @"systemItem" : NSStringFromStd(item.systemItem, @""),
      }];
    }
    _view.items = arr;
  }

  if (!prevProps || newProps.selectedValue != prevProps->selectedValue) {
    _view.selectedValue = NSStringFromStd(newProps.selectedValue, @"");
  }

  // Colors arrive as SharedColor (already processed by React Native)
  if (!prevProps || newProps.activeTintColor != prevProps->activeTintColor) {
    _view.activeTintColor = RCTUIColorFromSharedColor(newProps.activeTintColor);
  }
  if (!prevProps || newProps.inactiveTintColor != prevProps->inactiveTintColor) {
    _view.inactiveTintColor = RCTUIColorFromSharedColor(newProps.inactiveTintColor);
  }
  if (!prevProps || newProps.barColor != prevProps->barColor) {
    _view.barColor = RCTUIColorFromSharedColor(newProps.barColor);
  }
  if (!prevProps || newProps.badgeBackgroundColor != prevProps->badgeBackgroundColor) {
    _view.badgeBackgroundColor = RCTUIColorFromSharedColor(newProps.badgeBackgroundColor);
  }
  if (!prevProps || newProps.badgeTextColor != prevProps->badgeTextColor) {
    _view.badgeTextColor = RCTUIColorFromSharedColor(newProps.badgeTextColor);
  }

  if (!prevProps || !LabelStyleEqual(newProps.labelStyle, prevProps->labelStyle)) {
    _view.labelFont = FontFromLabelStyle(newProps.labelStyle);
  }

  if (!prevProps || newProps.minimizeBehavior != prevProps->minimizeBehavior) {
    _view.minimizeBehavior = NSStringFromStd(newProps.minimizeBehavior, @"");
  }
  if (!prevProps || newProps.scrollViewNativeID != prevProps->scrollViewNativeID) {
    _view.scrollViewNativeID = NSStringFromStd(newProps.scrollViewNativeID, @"");
  }
  if (!prevProps || newProps.accessoryID != prevProps->accessoryID) {
    _view.accessoryID = NSStringFromStd(newProps.accessoryID, @"");
  }

  if (!prevProps || newProps.haptics != prevProps->haptics) {
    _view.haptics.kind = NSStringFromStd(newProps.haptics, @"");
  }

  // maxFontSizeMultiplier: tab bar titles don't follow Dynamic Type on iOS
  // androidIndicator… / androidRippleColor / androidItemLayout: Android only

  [super updateProps:props oldProps:oldProps];

  [self updateMeasurements];
}

#pragma mark - State (Measuring)

- (void)updateState:(const State::Shared &)state
           oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<const MeasuringPCTabBarShadowNode::ConcreteState>(state);

  if (oldState == nullptr) {
    [self updateMeasurements];
  }

  [super updateState:state oldState:oldState];
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
  if (layoutMetrics.frame.size.width != oldLayoutMetrics.frame.size.width) {
    [self updateMeasurements];
  }
}

- (void)updateMeasurements {
  if (_state == nullptr) return;

  // The height UIKit wants at the width Yoga gave us; the width is left to
  // Yoga (0), so the bar fills its row
  CGSize size = [_view sizeForLayoutWithConstrainedTo:CGSizeMake(self.bounds.size.width, 0)];

  PCTabBarStateFrameSize next;
  next.frameSize = {0, (Float)size.height};
  if (_state->getData() != next) {
    _state->updateState(std::move(next));
  }
}

@end

Class<RCTComponentViewProtocol> PCTabBarCls(void) {
  return PCTabBar.class;
}
