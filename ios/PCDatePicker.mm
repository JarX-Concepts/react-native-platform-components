// ios/PCDatePicker.mm

#import "PCDatePicker.h"

#import <React/RCTConversions.h>
#import <react/renderer/components/PlatformComponentsViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#import <react/renderer/components/PlatformComponentsViewSpec/Props.h>
#import <react/renderer/components/PlatformComponentsViewSpec/RCTComponentViewHelpers.h>
#import <react/renderer/core/LayoutPrimitives.h>

#if __has_include(<PlatformComponents/PlatformComponents-Swift.h>)
#import <PlatformComponents/PlatformComponents-Swift.h>
#else
#import "PlatformComponents-Swift.h"
#endif

#import "PCDatePickerComponentDescriptors-custom.h"
#import "PCDatePickerShadowNode-custom.h"
#import "PCDatePickerState-custom.h"
#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@interface PCDatePicker () <RCTPCDatePickerViewProtocol>

- (void)updateMeasurements;
- (const PCDatePickerEventEmitter &)eventEmitterTyped;

@end

@implementation PCDatePicker {
  PCDatePickerView *_datePickerView;
  MeasuringPCDatePickerShadowNode::ConcreteState::Shared _state;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<MeasuringPCDatePickerComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    _datePickerView = [PCDatePickerView new];
    _datePickerView.translatesAutoresizingMaskIntoConstraints = NO;

    __weak __typeof(self) weakSelf = self;

    _datePickerView.onChangeHandler = ^(NSNumber *ms) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      PCDatePickerEventEmitter::OnConfirm event{};
      event.timestampMs = ms.doubleValue;

      strongSelf.eventEmitterTyped.onConfirm(event);
    };

    _datePickerView.onCancelHandler = ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      PCDatePickerEventEmitter::OnCancel event{};
      strongSelf.eventEmitterTyped.onCancel(event);
    };

    self.contentView = _datePickerView;

    [NSLayoutConstraint activateConstraints:@[
      [_datePickerView.topAnchor constraintEqualToAnchor:self.contentView.topAnchor],
      [_datePickerView.bottomAnchor constraintEqualToAnchor:self.contentView.bottomAnchor],
      [_datePickerView.leadingAnchor constraintEqualToAnchor:self.contentView.leadingAnchor],
      [_datePickerView.trailingAnchor constraintEqualToAnchor:self.contentView.trailingAnchor],
    ]];
  }

  return self;
}

- (void)layoutSubviews {
  [super layoutSubviews];
  _datePickerView.frame = self.bounds;
}

#pragma mark - Props

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps
{
  const auto &oldViewProps =
      *std::static_pointer_cast<const PCDatePickerProps>(_props);
  const auto &newViewProps =
      *std::static_pointer_cast<const PCDatePickerProps>(props);

  BOOL needsToUpdateMeasurements = NO;

  // presentation (default "modal")
  NSString *newPresentation =
      newViewProps.presentation.empty()
          ? @"modal"
          : [NSString stringWithUTF8String:newViewProps.presentation.c_str()];

  if (![_datePickerView.presentation isEqualToString:newPresentation]) {
    _datePickerView.presentation = newPresentation;
    needsToUpdateMeasurements = YES;
  }

  // visible: treat only "open" as open; everything else as closed
  BOOL shouldOpen = (newViewProps.visible == "open");
  NSNumber *newOpen = @(shouldOpen);
  if (![_datePickerView.open isEqual:newOpen]) {
    _datePickerView.open = newOpen;
  }

  // dateMs (sentinel -1)
  if (oldViewProps.dateMs != newViewProps.dateMs) {
    _datePickerView.dateMs = (newViewProps.dateMs >= 0) ? @(newViewProps.dateMs) : nil;
  }

  // min/max (sentinel -1)
  if (oldViewProps.minDateMs != newViewProps.minDateMs) {
    _datePickerView.minDateMs = (newViewProps.minDateMs >= 0) ? @(newViewProps.minDateMs) : nil;
  }
  if (oldViewProps.maxDateMs != newViewProps.maxDateMs) {
    _datePickerView.maxDateMs = (newViewProps.maxDateMs >= 0) ? @(newViewProps.maxDateMs) : nil;
  }

  // locale
  if (oldViewProps.locale != newViewProps.locale) {
    _datePickerView.localeIdentifier =
        (!newViewProps.locale.empty())
            ? [NSString stringWithUTF8String:newViewProps.locale.c_str()]
            : nil;
  }

  // time zone
  if (oldViewProps.timeZoneName != newViewProps.timeZoneName) {
    _datePickerView.timeZoneName =
        (!newViewProps.timeZoneName.empty())
            ? [NSString stringWithUTF8String:newViewProps.timeZoneName.c_str()]
            : nil;
  }

  // mode
  if (oldViewProps.mode != newViewProps.mode) {
    _datePickerView.mode =
        (!newViewProps.mode.empty())
            ? [NSString stringWithUTF8String:newViewProps.mode.c_str()]
            : @"date";
    needsToUpdateMeasurements = YES;
  }

  // ----- iOS nested props -----
  const auto &oldIos = oldViewProps.ios;
  const auto &newIos = newViewProps.ios;

  if (oldIos.preferredStyle != newIos.preferredStyle) {
    _datePickerView.preferredStyle =
        (!newIos.preferredStyle.empty())
            ? [NSString stringWithUTF8String:newIos.preferredStyle.c_str()]
            : nil;
    needsToUpdateMeasurements = YES;
  }

  if (oldIos.countDownDurationSeconds != newIos.countDownDurationSeconds) {
    _datePickerView.countDownDurationSeconds = @(newIos.countDownDurationSeconds);
  }

  if (oldIos.minuteInterval != newIos.minuteInterval) {
    _datePickerView.minuteIntervalValue = @(newIos.minuteInterval);
  }

  // Expecting: "inherit" | "round" | "noRound"
  if (oldIos.roundsToMinuteInterval != newIos.roundsToMinuteInterval) {
    if (!newIos.roundsToMinuteInterval.empty()) {
      _datePickerView.roundsToMinuteIntervalMode =
          [NSString stringWithUTF8String:newIos.roundsToMinuteInterval.c_str()];
    } else {
      _datePickerView.roundsToMinuteIntervalMode = @"inherit";
    }
  }

  if (needsToUpdateMeasurements) {
    [self updateMeasurements];
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics
{
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  // Fill whatever Yoga decided the content frame is.
  _datePickerView.frame = self.contentView.bounds;
}

#pragma mark - State (Measuring)

- (void)updateState:(const State::Shared &)state
           oldState:(const State::Shared &)oldState
{
  _state =
      std::static_pointer_cast<const MeasuringPCDatePickerShadowNode::ConcreteState>(state);

  if (oldState == nullptr) {
    // First time: compute initial size.
    [self updateMeasurements];
  }

  [super updateState:state oldState:oldState];
}

- (void)updateMeasurements {
  if (_state == nullptr) return;

  // Use the real width Yoga gave us (bounds is correct here after layoutMetrics update)
  const CGFloat w = self.bounds.size.width > 1 ? self.bounds.size.width : 320;

  CGSize size = [_datePickerView sizeForLayoutWithConstrainedTo:CGSizeMake(w, 0)];

  PCDatePickerStateFrameSize next;
  next.frameSize = { (Float)size.width, (Float)size.height };
  _state->updateState(std::move(next));
}

#pragma mark - Strongly typed emitter

- (const PCDatePickerEventEmitter &)eventEmitterTyped {
  return static_cast<const PCDatePickerEventEmitter &>(*_eventEmitter);
}

@end

Class<RCTComponentViewProtocol> RCTPCDatePickerCls(void) {
  return PCDatePicker.class;
}
