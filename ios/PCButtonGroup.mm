// PCButtonGroup.mm

#import "PCButtonGroup.h"

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

#import "PCButtonGroupComponentDescriptors-custom.h"
#import "PCButtonGroupShadowNode-custom.h"
#import "PCButtonGroupState-custom.h"
#import "PCMenuItems.h"

using namespace facebook::react;
using namespace platformcomponents;

namespace {
static inline bool ButtonsEqual(
    const std::vector<PCButtonGroupButtonsStruct> &a,
    const std::vector<PCButtonGroupButtonsStruct> &b) {
  if (a.size() != b.size()) return false;
  for (size_t i = 0; i < a.size(); i++) {
    if (a[i].label != b[i].label) return false;
    if (a[i].value != b[i].value) return false;
    if (a[i].disabled != b[i].disabled) return false;
    if (a[i].iconType != b[i].iconType) return false;
    if (a[i].iconName != b[i].iconName) return false;
    if (a[i].iconUri != b[i].iconUri) return false;
    if (a[i].iconScale != b[i].iconScale) return false;
    if (a[i].iconTinted != b[i].iconTinted) return false;
    if (a[i].accessibilityLabel != b[i].accessibilityLabel) return false;
  }
  return true;
}

static inline NSString *NSStringFromStd(const std::string &s, NSString *fallback) {
  return s.empty() ? fallback : [NSString stringWithUTF8String:s.c_str()];
}

static inline NSArray<NSString *> *NSArrayFromStd(const std::vector<std::string> &values) {
  NSMutableArray<NSString *> *arr = [NSMutableArray arrayWithCapacity:values.size()];
  for (const auto &value : values) {
    [arr addObject:NSStringFromStd(value, @"")];
  }
  return arr;
}

static inline bool LabelStyleEqual(
    const PCButtonGroupLabelStyleStruct &a,
    const PCButtonGroupLabelStyleStruct &b) {
  return a.fontFamily == b.fontFamily && a.fontSize == b.fontSize &&
         a.fontWeight == b.fontWeight && a.fontStyle == b.fontStyle;
}

/// Builds the label font from RN-style font props, or nil when every field is
/// unset so the buttons keep the configuration's font.
static UIFont *FontFromLabelStyle(const PCButtonGroupLabelStyleStruct &style) {
  if (style.fontFamily.empty() && style.fontSize <= 0 &&
      style.fontWeight.empty() && style.fontStyle.empty()) {
    return nil;
  }
  return [RCTFont updateFont:[UIFont preferredFontForTextStyle:UIFontTextStyleBody]
                  withFamily:NSStringFromStd(style.fontFamily, nil)
                        size:style.fontSize > 0 ? @(style.fontSize) : nil
                      weight:NSStringFromStd(style.fontWeight, nil)
                       style:NSStringFromStd(style.fontStyle, nil)
                     variant:nil
             scaleMultiplier:1.0];
}
} // namespace

@interface PCButtonGroup ()

- (void)updateMeasurements;

@end

@implementation PCButtonGroup {
  PCButtonGroupView *_view;
  MeasuringPCButtonGroupShadowNode::ConcreteState::Shared _state;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<MeasuringPCButtonGroupComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    // Fabric views seed _props with their own defaults: RCTViewComponentView
    // asserts on it in debug builds of React Native core, and the first
    // updateProps would otherwise read the base ViewProps as PCButtonGroupProps.
    static const auto defaultProps = std::make_shared<const PCButtonGroupProps>();
    _props = defaultProps;

    _view = [PCButtonGroupView new];
    self.contentView = _view;

    __weak __typeof(self) weakSelf = self;

    _view.onPress = ^(NSInteger index, NSString *value) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCButtonGroupEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      PCButtonGroupEventEmitter::OnButtonPress payload = {
          .index = (int)index,
          .value = value.UTF8String,
      };
      eventEmitter->onButtonPress(payload);
    };

    _view.onSelectionChange = ^(NSArray<NSString *> *values) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCButtonGroupEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      PCButtonGroupEventEmitter::OnGroupSelectionChange payload;
      for (NSString *value in values) {
        payload.values.push_back(value.UTF8String);
      }
      eventEmitter->onGroupSelectionChange(payload);
    };

    _view.onMenuSelect = ^(NSString *itemId, NSString *title) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCButtonGroupEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onMenuSelect({.id = itemId.UTF8String, .title = title.UTF8String});
    };

    _view.onMenuOpen = ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCButtonGroupEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onMenuOpen({});
    };

    _view.onMenuClose = ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCButtonGroupEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onMenuClose({});
    };

    _view.onNeedsRemeasure = ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;
      [strongSelf updateMeasurements];
    };
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
  const auto &newProps = *std::static_pointer_cast<const PCButtonGroupProps>(props);
  const auto prevProps = std::static_pointer_cast<const PCButtonGroupProps>(oldProps);

  // split: 'true' | 'false'. Before the buttons, which it shapes.
  if (!prevProps || newProps.split != prevProps->split) {
    _view.split = (newProps.split == "true");
  }

  // buttons: [{label, value, disabled, iconType, iconName, iconUri, iconScale,
  //            iconTinted, accessibilityLabel}]
  if (!prevProps || !ButtonsEqual(newProps.buttons, prevProps->buttons)) {
    NSMutableArray *arr = [NSMutableArray new];
    for (const auto &button : newProps.buttons) {
      [arr addObject:@{
        @"label": NSStringFromStd(button.label, @""),
        @"value": NSStringFromStd(button.value, @""),
        @"disabled": NSStringFromStd(button.disabled, @"enabled"),
        @"iconType": NSStringFromStd(button.iconType, @""),
        @"iconName": NSStringFromStd(button.iconName, @""),
        @"iconUri": NSStringFromStd(button.iconUri, @""),
        @"iconScale": @(button.iconScale),
        @"iconTinted": NSStringFromStd(button.iconTinted, @"true"),
        @"accessibilityLabel": NSStringFromStd(button.accessibilityLabel, @""),
      }];
    }
    _view.buttons = arr;
  }

  if (!prevProps || newProps.variant != prevProps->variant) {
    _view.variant = NSStringFromStd(newProps.variant, @"outlined");
  }

  if (!prevProps || newProps.size != prevProps->size) {
    _view.size = NSStringFromStd(newProps.size, @"small");
  }

  if (!prevProps || newProps.shape != prevProps->shape) {
    _view.shape = NSStringFromStd(newProps.shape, @"");
  }

  if (!prevProps || newProps.connected != prevProps->connected) {
    _view.connected = (newProps.connected == "true");
  }

  if (!prevProps || newProps.spacing != prevProps->spacing) {
    _view.spacing = newProps.spacing;
  }

  if (!prevProps || newProps.selection != prevProps->selection) {
    _view.selection = NSStringFromStd(newProps.selection, @"none");
  }

  if (!prevProps || newProps.selectedValues != prevProps->selectedValues) {
    _view.selectedValues = NSArrayFromStd(newProps.selectedValues);
  }

  if (!prevProps || newProps.selectionRequired != prevProps->selectionRequired) {
    _view.selectionRequired = (newProps.selectionRequired == "true");
  }

  if (!prevProps || newProps.interactivity != prevProps->interactivity) {
    _view.interactivity = NSStringFromStd(newProps.interactivity, @"enabled");
  }

  // Colors arrive as SharedColor (already processed by React Native)
  if (!prevProps || newProps.color != prevProps->color) {
    _view.containerColor = RCTUIColorFromSharedColor(newProps.color);
  }

  if (!prevProps || newProps.foregroundColor != prevProps->foregroundColor) {
    _view.foregroundColor = RCTUIColorFromSharedColor(newProps.foregroundColor);
  }

  // labelStyle: {fontFamily, fontSize, fontWeight, fontStyle}
  if (!prevProps || !LabelStyleEqual(newProps.labelStyle, prevProps->labelStyle)) {
    _view.labelFont = FontFromLabelStyle(newProps.labelStyle);
  }

  // overflow: 'none' | 'menu' | 'wrap' (Android only)
  if (!prevProps || newProps.overflow != prevProps->overflow) {
    _view.overflow = NSStringFromStd(newProps.overflow, @"none");
  }

  // menu: the split button's flattened menu items
  if (!prevProps || !PCMenuItemsEqual(newProps.menu, prevProps->menu)) {
    _view.menuItems = PCMenuItemsToArray(newProps.menu);
  }

  if (!prevProps || newProps.menuAccessibilityLabel != prevProps->menuAccessibilityLabel) {
    _view.menuAccessibilityLabel = NSStringFromStd(newProps.menuAccessibilityLabel, @"");
  }

  // androidRippleColor / androidStrokeColor / android: Android only

  [super updateProps:props oldProps:oldProps];

  // Update measurements when props change that affect layout
  [self updateMeasurements];
}

#pragma mark - State (Measuring)

- (void)updateState:(const State::Shared &)state
           oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<const MeasuringPCButtonGroupShadowNode::ConcreteState>(state);

  if (oldState == nullptr) {
    // First time: compute initial size.
    [self updateMeasurements];
  }

  [super updateState:state oldState:oldState];
}

- (void)updateMeasurements {
  if (_state == nullptr)
    return;

  // The group's natural size; Yoga clamps it to the available width
  CGSize size = [_view sizeForLayoutWithConstrainedTo:CGSizeZero];

  PCButtonGroupStateFrameSize next;
  next.frameSize = {(Float)size.width, (Float)size.height};
  _state->updateState(std::move(next));
}

@end

Class<RCTComponentViewProtocol> PCButtonGroupCls(void) {
  return PCButtonGroup.class;
}
