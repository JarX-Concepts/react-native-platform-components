// PCNavigationRail.mm

#import "PCNavigationRail.h"

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

#import "PCNavigationRailComponentDescriptors-custom.h"
#import "PCNavigationRailShadowNode-custom.h"
#import "PCNavigationRailState-custom.h"

using namespace facebook::react;

namespace {
static inline bool ItemsEqual(
    const std::vector<PCNavigationRailItemsStruct> &a,
    const std::vector<PCNavigationRailItemsStruct> &b) {
  if (a.size() != b.size()) return false;
  for (size_t i = 0; i < a.size(); i++) {
    const auto &x = a[i];
    const auto &y = b[i];
    if (x.label != y.label || x.value != y.value || x.disabled != y.disabled ||
        x.iconType != y.iconType || x.iconName != y.iconName || x.iconRequest != y.iconRequest || x.iconUri != y.iconUri ||
        x.iconScale != y.iconScale || x.iconTinted != y.iconTinted ||
        x.selectedIconType != y.selectedIconType || x.selectedIconName != y.selectedIconName ||
        x.selectedIconRequest != y.selectedIconRequest || x.selectedIconUri != y.selectedIconUri || x.selectedIconScale != y.selectedIconScale ||
        x.selectedIconTinted != y.selectedIconTinted || x.badge != y.badge ||
        x.accessibilityLabel != y.accessibilityLabel || x.testID != y.testID ||
        x.role != y.role) {
      return false;
    }
  }
  return true;
}

static inline NSString *NSStringFromStd(const std::string &s, NSString *fallback) {
  return s.empty() ? fallback : [NSString stringWithUTF8String:s.c_str()];
}

static inline bool LabelStyleEqual(
    const PCNavigationRailLabelStyleStruct &a,
    const PCNavigationRailLabelStyleStruct &b) {
  return a.fontFamily == b.fontFamily && a.fontSize == b.fontSize &&
         a.fontWeight == b.fontWeight && a.fontStyle == b.fontStyle;
}

/// Builds the label font from RN-style font props, or nil when every field is
/// unset so the rail keeps its default. Without a fontSize the size follows
/// Dynamic Type (the caption style), capped at maxFontSizeMultiplier times its
/// default size when that is 1 or more.
static UIFont *FontFromLabelStyle(const PCNavigationRailLabelStyleStruct &style, double maxFontSizeMultiplier) {
  if (style.fontFamily.empty() && style.fontSize <= 0 &&
      style.fontWeight.empty() && style.fontStyle.empty() && maxFontSizeMultiplier < 1) {
    return nil;
  }
  UIFont *caption = [UIFont preferredFontForTextStyle:UIFontTextStyleCaption1];
  NSNumber *size = style.fontSize > 0 ? @(style.fontSize) : nil;
  if (!size && maxFontSizeMultiplier >= 1) {
    UITraitCollection *defaultTraits =
        [UITraitCollection traitCollectionWithPreferredContentSizeCategory:UIContentSizeCategoryLarge];
    CGFloat baseSize = [UIFont preferredFontForTextStyle:UIFontTextStyleCaption1
                           compatibleWithTraitCollection:defaultTraits].pointSize;
    size = @(MIN(caption.pointSize, baseSize * maxFontSizeMultiplier));
  }
  return [RCTFont updateFont:[UIFont systemFontOfSize:caption.pointSize weight:UIFontWeightMedium]
                  withFamily:NSStringFromStd(style.fontFamily, nil)
                        size:size
                      weight:NSStringFromStd(style.fontWeight, nil)
                       style:NSStringFromStd(style.fontStyle, nil)
                     variant:nil
             scaleMultiplier:1.0];
}
} // namespace

@interface PCNavigationRail ()

- (void)updateMeasurements;

@end

@implementation PCNavigationRail {
  PCNavigationRailView *_view;
  MeasuringPCNavigationRailShadowNode::ConcreteState::Shared _state;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<MeasuringPCNavigationRailComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    // Fabric views seed _props with their own defaults: RCTViewComponentView
    // asserts on it in debug builds of React Native core, and the first
    // updateProps would otherwise read the base ViewProps as the component's.
    static const auto defaultProps = std::make_shared<const PCNavigationRailProps>();
    _props = defaultProps;

    // A plain subview rather than the contentView, which Fabric sizes to the
    // content frame: the width padding (see shared/) would leave it none
    _view = [PCNavigationRailView new];
    [self addSubview:_view];

    __weak __typeof(self) weakSelf = self;

    _view.onItemPress = ^(NSInteger index, NSString *value, BOOL reselected) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      [strongSelf->_view.haptics performIn:strongSelf->_view];

      auto eventEmitter =
          std::static_pointer_cast<const PCNavigationRailEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      PCNavigationRailEventEmitter::OnItemPress payload = {
          .index = (int)index,
          .value = value.UTF8String,
          .reselected = reselected ? "true" : "false",
      };
      eventEmitter->onItemPress(payload);
    };

    _view.onNeedsRemeasure = ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;
      [strongSelf updateMeasurements];
    };
  }
  return self;
}

- (void)layoutSubviews {
  [super layoutSubviews];
  _view.frame = self.bounds;
}

// The header goes above the destinations; the rail places it
- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [_view.headerContainer insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
  [childComponentView removeFromSuperview];
}

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
  const auto &newProps = *std::static_pointer_cast<const PCNavigationRailProps>(props);
  const auto prevProps = std::static_pointer_cast<const PCNavigationRailProps>(oldProps);

  if (!prevProps || newProps.expanded != prevProps->expanded) {
    _view.expanded = newProps.expanded == "true";
  }

  if (!prevProps || newProps.labelVisibility != prevProps->labelVisibility) {
    _view.labelVisibility = NSStringFromStd(newProps.labelVisibility, @"auto");
  }

  if (!prevProps || newProps.menuGravity != prevProps->menuGravity) {
    _view.menuGravity = NSStringFromStd(newProps.menuGravity, @"top");
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
        @"iconRequest" : NSStringFromStd(item.iconRequest, @""),
        @"iconUri" : NSStringFromStd(item.iconUri, @""),
        @"iconScale" : @(item.iconScale),
        @"iconTinted" : NSStringFromStd(item.iconTinted, @"true"),
        @"selectedIconType" : NSStringFromStd(item.selectedIconType, @""),
        @"selectedIconName" : NSStringFromStd(item.selectedIconName, @""),
        @"selectedIconRequest" : NSStringFromStd(item.selectedIconRequest, @""),
        @"selectedIconUri" : NSStringFromStd(item.selectedIconUri, @""),
        @"selectedIconScale" : @(item.selectedIconScale),
        @"selectedIconTinted" : NSStringFromStd(item.selectedIconTinted, @"true"),
        @"badge" : NSStringFromStd(item.badge, @""),
        @"accessibilityLabel" : NSStringFromStd(item.accessibilityLabel, @""),
        @"testID" : NSStringFromStd(item.testID, @""),
        @"role" : NSStringFromStd(item.role, @""),
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
  if (!prevProps || newProps.railColor != prevProps->railColor) {
    _view.railColor = RCTUIColorFromSharedColor(newProps.railColor);
  }
  if (!prevProps || newProps.badgeBackgroundColor != prevProps->badgeBackgroundColor) {
    _view.badgeBackgroundColor = RCTUIColorFromSharedColor(newProps.badgeBackgroundColor);
  }
  if (!prevProps || newProps.badgeTextColor != prevProps->badgeTextColor) {
    _view.badgeTextColor = RCTUIColorFromSharedColor(newProps.badgeTextColor);
  }

  if (!prevProps || !LabelStyleEqual(newProps.labelStyle, prevProps->labelStyle) ||
      newProps.maxFontSizeMultiplier != prevProps->maxFontSizeMultiplier) {
    _view.labelFont = FontFromLabelStyle(newProps.labelStyle, newProps.maxFontSizeMultiplier);
  }

  // items' systemItem: TabBar only
  if (!prevProps || newProps.haptics != prevProps->haptics) {
    _view.haptics.kind = NSStringFromStd(newProps.haptics, @"");
  }

  // androidIndicatorColor / androidRippleColor: Android only

  [super updateProps:props oldProps:oldProps];

  [self updateMeasurements];
}

#pragma mark - State (Measuring)

- (void)updateState:(const State::Shared &)state
           oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<const MeasuringPCNavigationRailShadowNode::ConcreteState>(state);

  if (oldState == nullptr) {
    [self updateMeasurements];
  }

  [super updateState:state oldState:oldState];
}

- (void)updateMeasurements {
  if (_state == nullptr) return;

  // The rail's natural width; the height is the app's
  PCNavigationRailStateFrameSize next;
  next.frameSize = {(Float)[_view naturalWidth], 0};
  if (_state->getData() != next) {
    _state->updateState(std::move(next));
  }
}

@end

Class<RCTComponentViewProtocol> PCNavigationRailCls(void) {
  return PCNavigationRail.class;
}
