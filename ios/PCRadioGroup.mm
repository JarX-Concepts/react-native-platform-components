// PCRadioGroup.mm

#import "PCRadioGroup.h"

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

#import "PCRadioGroupComponentDescriptors-custom.h"
#import "PCRadioGroupShadowNode-custom.h"
#import "PCRadioGroupState-custom.h"

using namespace facebook::react;

namespace {
static inline bool OptionsEqual(
    const std::vector<PCRadioGroupOptionsStruct> &a,
    const std::vector<PCRadioGroupOptionsStruct> &b) {
  if (a.size() != b.size()) return false;
  for (size_t i = 0; i < a.size(); i++) {
    if (a[i].value != b[i].value) return false;
    if (a[i].label != b[i].label) return false;
    if (a[i].description != b[i].description) return false;
    if (a[i].disabled != b[i].disabled) return false;
    if (a[i].testID != b[i].testID) return false;
    if (a[i].accessibilityLabel != b[i].accessibilityLabel) return false;
  }
  return true;
}

static inline NSString *NSStringFromStd(const std::string &s, NSString *fallback) {
  return s.empty() ? fallback : [NSString stringWithUTF8String:s.c_str()];
}
} // namespace

@interface PCRadioGroup ()

- (void)updateMeasurements;

@end

@implementation PCRadioGroup {
  PCRadioGroupView *_view;
  MeasuringPCRadioGroupShadowNode::ConcreteState::Shared _state;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<MeasuringPCRadioGroupComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    // Fabric views seed _props with their own defaults: RCTViewComponentView
    // asserts on it in debug builds of React Native core, and the first
    // updateProps would otherwise read the base ViewProps as PCRadioGroupProps.
    static const auto defaultProps = std::make_shared<const PCRadioGroupProps>();
    _props = defaultProps;

    _view = [PCRadioGroupView new];
    self.contentView = _view;

    __weak __typeof(self) weakSelf = self;

    _view.onChange = ^(NSInteger index, NSString *value) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCRadioGroupEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onRadioGroupChange({.index = (int)index, .value = value.UTF8String});
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
  const auto &newProps = *std::static_pointer_cast<const PCRadioGroupProps>(props);
  const auto prevProps = std::static_pointer_cast<const PCRadioGroupProps>(oldProps);

  // options: [{value, label, description, disabled, testID, accessibilityLabel}]
  if (!prevProps || !OptionsEqual(newProps.options, prevProps->options)) {
    NSMutableArray *arr = [NSMutableArray new];
    for (const auto &option : newProps.options) {
      [arr addObject:@{
        @"value": NSStringFromStd(option.value, @""),
        @"label": NSStringFromStd(option.label, @""),
        @"description": NSStringFromStd(option.description, @""),
        @"disabled": NSStringFromStd(option.disabled, @"enabled"),
        @"testID": NSStringFromStd(option.testID, @""),
        @"accessibilityLabel": NSStringFromStd(option.accessibilityLabel, @""),
      }];
    }
    _view.options = arr;
  }

  // The rows show only the prop, so a pick the parent didn't take changes
  // nothing (valueEventCount is for Android's own checking).
  if (!prevProps || newProps.value != prevProps->value) {
    _view.value = NSStringFromStd(newProps.value, @"");
  }

  if (!prevProps || newProps.errorState != prevProps->errorState) {
    _view.errorState = NSStringFromStd(newProps.errorState, @"none");
  }

  if (!prevProps || newProps.errorText != prevProps->errorText) {
    _view.errorText = NSStringFromStd(newProps.errorText, @"");
  }

  if (!prevProps || newProps.interactivity != prevProps->interactivity) {
    _view.interactivity = NSStringFromStd(newProps.interactivity, @"enabled");
  }

  if (!prevProps || newProps.maxFontSizeMultiplier != prevProps->maxFontSizeMultiplier) {
    _view.maxFontSizeMultiplier = newProps.maxFontSizeMultiplier;
  }

  if (!prevProps || newProps.groupLabel != prevProps->groupLabel) {
    _view.groupLabel = NSStringFromStd(newProps.groupLabel, @"");
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
  _state = std::static_pointer_cast<const MeasuringPCRadioGroupShadowNode::ConcreteState>(state);

  if (oldState == nullptr) {
    // First time: compute initial size.
    [self updateMeasurements];
  }

  [super updateState:state oldState:oldState];
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
  // A new width changes how many lines the labels wrap onto
  if (layoutMetrics.frame.size.width != oldLayoutMetrics.frame.size.width) {
    [self updateMeasurements];
  }
}

- (void)updateMeasurements {
  if (_state == nullptr)
    return;

  // The widest option on one line, and the height at the current width
  CGSize size = [_view sizeForLayoutWithConstrainedTo:CGSizeMake(self.bounds.size.width, 0)];

  PCRadioGroupStateFrameSize next;
  next.frameSize = {(Float)size.width, (Float)size.height};
  if (_state->getData() != next) {
    _state->updateState(std::move(next));
  }
}

@end

Class<RCTComponentViewProtocol> PCRadioGroupCls(void) {
  return PCRadioGroup.class;
}
