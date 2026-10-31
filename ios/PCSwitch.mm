// PCSwitch.mm

#import "PCSwitch.h"

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

#import "PCSwitchComponentDescriptors-custom.h"
#import "PCSwitchShadowNode-custom.h"
#import "PCSwitchState-custom.h"

using namespace facebook::react;

namespace {
static inline NSString *NSStringFromStd(const std::string &s, NSString *fallback) {
  return s.empty() ? fallback : [NSString stringWithUTF8String:s.c_str()];
}
} // namespace

@interface PCSwitch ()

- (void)updateMeasurements;
- (void)placeSwitchView;

@end

@implementation PCSwitch {
  PCSwitchView *_view;
  MeasuringPCSwitchShadowNode::ConcreteState::Shared _state;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<MeasuringPCSwitchComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    // Fabric views seed _props with their own defaults: RCTViewComponentView
    // asserts on it in debug builds of React Native core, and the first
    // updateProps would otherwise read the base ViewProps as PCSwitchProps.
    static const auto defaultProps = std::make_shared<const PCSwitchProps>();
    _props = defaultProps;

    _view = [PCSwitchView new];
    self.contentView = _view;

    __weak __typeof(self) weakSelf = self;

    _view.onValueChange = ^(BOOL value) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCSwitchEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onSwitchChange({.value = (bool)value});
    };

    _view.onNeedsRemeasure = ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;
      [strongSelf updateMeasurements];
      [strongSelf placeSwitchView];
    };
  }
  return self;
}

// The inner view is the accessibility element (it carries the label, the
// switch trait and value, and the testID); this host must not be one too.
- (BOOL)isAccessibilityElement {
  return NO;
}

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
  const auto &newProps = *std::static_pointer_cast<const PCSwitchProps>(props);
  const auto prevProps = std::static_pointer_cast<const PCSwitchProps>(oldProps);

  if (!prevProps || newProps.label != prevProps->label) {
    _view.label = NSStringFromStd(newProps.label, @"");
  }

  if (!prevProps || newProps.interactivity != prevProps->interactivity) {
    _view.interactivity = NSStringFromStd(newProps.interactivity, @"enabled");
  }

  // Colors arrive as SharedColor (already processed by React Native)
  if (!prevProps || newProps.color != prevProps->color) {
    _view.onColor = RCTUIColorFromSharedColor(newProps.color);
  }

  if (!prevProps || newProps.trackColor != prevProps->trackColor) {
    _view.offTrackColor = RCTUIColorFromSharedColor(newProps.trackColor);
  }

  if (!prevProps || newProps.thumbColor != prevProps->thumbColor) {
    _view.thumbColor = RCTUIColorFromSharedColor(newProps.thumbColor);
  }

  // thumbIcon: Android only

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

  // The testID belongs on the inner view, the element that carries the
  // label and takes the touches (Detox reads the label and the switch state
  // from the element it finds by ID)
  if (testIdChanged) {
    _view.testID = NSStringFromStd(newProps.testId, @"");
    self.accessibilityIdentifier = nil;
  }

  // The switch shows `value`: after a change of the prop, and after every
  // toggle (valueEventCount), so a toggle the parent didn't take goes back
  _view.value = newProps.value;
  [_view syncValue];

  // Update measurements when props change that affect layout
  [self updateMeasurements];
  [self placeSwitchView];
}

#pragma mark - Layout

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  // React lays the content view out inside the padding; the row takes the
  // padding too, so that a tap there toggles it
  const auto &insets = layoutMetrics.contentInsets;
  _view.contentInsets = UIEdgeInsetsMake(insets.top, insets.left, insets.bottom, insets.right);
  [self placeSwitchView];

  // A new width changes how many lines the label wraps onto
  if (layoutMetrics.frame.size.width != oldLayoutMetrics.frame.size.width) {
    [self updateMeasurements];
  }
}

- (void)placeSwitchView {
  UIEdgeInsets insets = _view.contentInsets;
  CGRect frame = [_view frameIn:self.bounds insets:insets];
  if (!CGRectEqualToRect(_view.frame, frame)) {
    _view.frame = frame;
  }
  [_view setNeedsLayout];
}

#pragma mark - State (Measuring)

- (void)updateState:(const State::Shared &)state
           oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<const MeasuringPCSwitchShadowNode::ConcreteState>(state);

  if (oldState == nullptr) {
    // First time: compute initial size.
    [self updateMeasurements];
  }

  [super updateState:state oldState:oldState];
}

- (void)updateMeasurements {
  if (_state == nullptr)
    return;

  // The row's width with the label on one line, and its height at the
  // current width
  CGSize size = [_view sizeForLayoutWithConstrainedTo:CGSizeMake(self.bounds.size.width, 0)];

  PCSwitchStateFrameSize next;
  next.frameSize = {(Float)size.width, (Float)size.height};
  if (_state->getData() != next) {
    _state->updateState(std::move(next));
  }
}

@end

Class<RCTComponentViewProtocol> PCSwitchCls(void) {
  return PCSwitch.class;
}
