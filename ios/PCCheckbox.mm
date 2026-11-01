// PCCheckbox.mm

#import "PCCheckbox.h"

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

#import "PCCheckboxComponentDescriptors-custom.h"
#import "PCCheckboxShadowNode-custom.h"
#import "PCCheckboxState-custom.h"

using namespace facebook::react;

namespace {
static inline NSString *NSStringFromStd(const std::string &s, NSString *fallback) {
  return s.empty() ? fallback : [NSString stringWithUTF8String:s.c_str()];
}
} // namespace

@interface PCCheckbox ()

- (void)updateMeasurements;

@end

@implementation PCCheckbox {
  PCCheckboxView *_view;
  MeasuringPCCheckboxShadowNode::ConcreteState::Shared _state;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<MeasuringPCCheckboxComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    // Fabric views seed _props with their own defaults: RCTViewComponentView
    // asserts on it in debug builds of React Native core, and the first
    // updateProps would otherwise read the base ViewProps as PCCheckboxProps.
    static const auto defaultProps = std::make_shared<const PCCheckboxProps>();
    _props = defaultProps;

    _view = [PCCheckboxView new];
    self.contentView = _view;

    __weak __typeof(self) weakSelf = self;

    _view.onToggle = ^(BOOL checked) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCCheckboxEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onCheckboxToggle({.checked = (bool)checked});
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
  const auto &newProps = *std::static_pointer_cast<const PCCheckboxProps>(props);
  const auto prevProps = std::static_pointer_cast<const PCCheckboxProps>(oldProps);

  // checked: 'true' | 'false' | 'indeterminate'. The row shows only the
  // prop, so a toggle the parent didn't take changes nothing
  // (checkedEventCount is for Android's own toggling).
  if (!prevProps || newProps.checked != prevProps->checked) {
    _view.checked = NSStringFromStd(newProps.checked, @"false");
  }

  if (!prevProps || newProps.label != prevProps->label) {
    _view.label = NSStringFromStd(newProps.label, @"");
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

  if (!prevProps || newProps.spokenLabel != prevProps->spokenLabel) {
    _view.spokenLabel = NSStringFromStd(newProps.spokenLabel, @"");
  }

  if (!prevProps || newProps.haptics != prevProps->haptics) {
    _view.haptics.kind = NSStringFromStd(newProps.haptics, @"");
  }

  const bool testIdChanged = !prevProps || newProps.testId != prevProps->testId;

  [super updateProps:props oldProps:oldProps];

  // testID belongs on the row, the element that carries the label, the
  // state and the touches; two views with one id would be ambiguous
  if (testIdChanged) {
    _view.testID = NSStringFromStd(newProps.testId, @"");
    self.accessibilityIdentifier = nil;
  }

  // Update measurements when props change that affect layout
  [self updateMeasurements];
}

#pragma mark - State (Measuring)

- (void)updateState:(const State::Shared &)state
           oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<const MeasuringPCCheckboxShadowNode::ConcreteState>(state);

  if (oldState == nullptr) {
    // First time: compute initial size.
    [self updateMeasurements];
  }

  [super updateState:state oldState:oldState];
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
  // A new width changes how many lines the label wraps onto
  if (layoutMetrics.frame.size.width != oldLayoutMetrics.frame.size.width) {
    [self updateMeasurements];
  }
}

- (void)updateMeasurements {
  if (_state == nullptr)
    return;

  // The width of the box and label on one line, and the height at the
  // current width
  CGSize size = [_view sizeForLayoutWithConstrainedTo:CGSizeMake(self.bounds.size.width, 0)];

  PCCheckboxStateFrameSize next;
  next.frameSize = {(Float)size.width, (Float)size.height};
  if (_state->getData() != next) {
    _state->updateState(std::move(next));
  }
}

@end

Class<RCTComponentViewProtocol> PCCheckboxCls(void) {
  return PCCheckbox.class;
}
