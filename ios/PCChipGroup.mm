// PCChipGroup.mm

#import "PCChipGroup.h"

#import <React/RCTComponentViewFactory.h>
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>

#import <react/renderer/components/PlatformComponentsViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#import <react/renderer/components/PlatformComponentsViewSpec/Props.h>
#import <react/renderer/core/LayoutPrimitives.h>

#if __has_include(<PlatformComponents/PlatformComponents-Swift.h>)
#import <PlatformComponents/PlatformComponents-Swift.h>
#else
#import "PlatformComponents-Swift.h"
#endif

#import "PCChipGroupComponentDescriptors-custom.h"
#import "PCChipGroupShadowNode-custom.h"
#import "PCChipGroupState-custom.h"

using namespace facebook::react;

namespace {
static inline bool ChipsEqual(
    const std::vector<PCChipGroupChipsStruct> &a,
    const std::vector<PCChipGroupChipsStruct> &b) {
  if (a.size() != b.size()) return false;
  for (size_t i = 0; i < a.size(); i++) {
    if (a[i].label != b[i].label) return false;
    if (a[i].value != b[i].value) return false;
    if (a[i].disabled != b[i].disabled) return false;
    if (a[i].iconType != b[i].iconType) return false;
    if (a[i].iconName != b[i].iconName) return false;
    if (a[i].iconRequest != b[i].iconRequest || a[i].iconUri != b[i].iconUri) return false;
    if (a[i].iconScale != b[i].iconScale) return false;
    if (a[i].iconTinted != b[i].iconTinted) return false;
    if (a[i].closeIcon != b[i].closeIcon) return false;
    if (a[i].testID != b[i].testID) return false;
    if (a[i].closeTestID != b[i].closeTestID) return false;
    if (a[i].accessibilityLabel != b[i].accessibilityLabel) return false;
    if (a[i].closeAccessibilityLabel != b[i].closeAccessibilityLabel) return false;
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
} // namespace

@interface PCChipGroup ()

- (void)updateMeasurements;

@end

@implementation PCChipGroup {
  PCChipGroupView *_view;
  MeasuringPCChipGroupShadowNode::ConcreteState::Shared _state;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<MeasuringPCChipGroupComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    // Fabric views seed _props with their own defaults: RCTViewComponentView
    // asserts on it in debug builds of React Native core, and the first
    // updateProps would otherwise read the base ViewProps as PCChipGroupProps.
    static const auto defaultProps = std::make_shared<const PCChipGroupProps>();
    _props = defaultProps;

    _view = [PCChipGroupView new];
    self.contentView = _view;

    __weak __typeof(self) weakSelf = self;

    _view.onPress = ^(NSInteger index, NSString *value) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCChipGroupEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onChipPress({.index = (int)index, .value = value.UTF8String});
    };

    _view.onClose = ^(NSInteger index, NSString *value) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCChipGroupEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onChipClose({.index = (int)index, .value = value.UTF8String});
    };

    _view.onSelectionChange = ^(NSArray<NSString *> *values) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCChipGroupEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      PCChipGroupEventEmitter::OnGroupSelectionChange payload;
      for (NSString *value in values) {
        payload.values.push_back(value.UTF8String);
      }
      eventEmitter->onGroupSelectionChange(payload);
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
  const auto &newProps = *std::static_pointer_cast<const PCChipGroupProps>(props);
  const auto prevProps = std::static_pointer_cast<const PCChipGroupProps>(oldProps);

  // chips: [{label, value, disabled, iconType, iconName, iconRequest, iconUri,
  //          iconScale, iconTinted, closeIcon, testID, closeTestID,
  //          accessibilityLabel, closeAccessibilityLabel}]
  if (!prevProps || !ChipsEqual(newProps.chips, prevProps->chips)) {
    NSMutableArray *arr = [NSMutableArray new];
    for (const auto &chip : newProps.chips) {
      [arr addObject:@{
        @"label": NSStringFromStd(chip.label, @""),
        @"value": NSStringFromStd(chip.value, @""),
        @"disabled": NSStringFromStd(chip.disabled, @"enabled"),
        @"iconType": NSStringFromStd(chip.iconType, @""),
        @"iconName": NSStringFromStd(chip.iconName, @""),
        @"iconRequest": NSStringFromStd(chip.iconRequest, @""),
        @"iconUri": NSStringFromStd(chip.iconUri, @""),
        @"iconScale": @(chip.iconScale),
        @"iconTinted": NSStringFromStd(chip.iconTinted, @"true"),
        @"closeIcon": NSStringFromStd(chip.closeIcon, @"false"),
        @"testID": NSStringFromStd(chip.testID, @""),
        @"closeTestID": NSStringFromStd(chip.closeTestID, @""),
        @"accessibilityLabel": NSStringFromStd(chip.accessibilityLabel, @""),
        @"closeAccessibilityLabel": NSStringFromStd(chip.closeAccessibilityLabel, @""),
      }];
    }
    _view.chips = arr;
  }

  if (!prevProps || newProps.variant != prevProps->variant) {
    _view.variant = NSStringFromStd(newProps.variant, @"assist");
  }

  if (!prevProps || newProps.selection != prevProps->selection) {
    _view.selection = NSStringFromStd(newProps.selection, @"none");
  }

  // The chips show only the prop, so a change the parent didn't take
  // changes nothing (selectionEventCount is for Android's own toggling).
  if (!prevProps || newProps.selectedValues != prevProps->selectedValues) {
    _view.selectedValues = NSArrayFromStd(newProps.selectedValues);
  }

  if (!prevProps || newProps.selectionRequired != prevProps->selectionRequired) {
    _view.selectionRequired = (newProps.selectionRequired == "true");
  }

  if (!prevProps || newProps.wrap != prevProps->wrap) {
    _view.wrap = (newProps.wrap != "false");
  }

  if (!prevProps || newProps.spacing != prevProps->spacing) {
    _view.spacing = newProps.spacing;
  }

  if (!prevProps || newProps.interactivity != prevProps->interactivity) {
    _view.interactivity = NSStringFromStd(newProps.interactivity, @"enabled");
  }

  if (!prevProps || newProps.maxFontSizeMultiplier != prevProps->maxFontSizeMultiplier) {
    _view.maxFontSizeMultiplier = newProps.maxFontSizeMultiplier;
  }

  if (!prevProps || newProps.chipMinHeight != prevProps->chipMinHeight) {
    _view.chipMinHeight = newProps.chipMinHeight;
  }

  if (!prevProps || newProps.chipPaddingHorizontal != prevProps->chipPaddingHorizontal) {
    _view.chipPaddingHorizontal = newProps.chipPaddingHorizontal;
  }

  if (!prevProps || newProps.haptics != prevProps->haptics) {
    _view.haptics.kind = NSStringFromStd(newProps.haptics, @"");
  }

  [super updateProps:props oldProps:oldProps];

  // Update measurements when props change that affect layout
  [self updateMeasurements];
}

#pragma mark - State (Measuring)

- (void)updateState:(const State::Shared &)state
           oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<const MeasuringPCChipGroupShadowNode::ConcreteState>(state);

  if (oldState == nullptr) {
    // First time: compute initial size.
    [self updateMeasurements];
  }

  [super updateState:state oldState:oldState];
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
  // A new width changes how many rows the chips wrap onto
  if (layoutMetrics.frame.size.width != oldLayoutMetrics.frame.size.width) {
    [self updateMeasurements];
  }
}

- (void)updateMeasurements {
  if (_state == nullptr)
    return;

  // The width of the chips on one row, and the height at the current width
  CGSize size = [_view sizeForLayoutWithConstrainedTo:CGSizeMake(self.bounds.size.width, 0)];

  PCChipGroupStateFrameSize next;
  next.frameSize = {(Float)size.width, (Float)size.height};
  if (_state->getData() != next) {
    _state->updateState(std::move(next));
  }
}

@end

Class<RCTComponentViewProtocol> PCChipGroupCls(void) {
  return PCChipGroup.class;
}
