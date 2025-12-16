// ios/DatePicker.mm

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
@end

@implementation PCDatePicker {
  PCDatePickerView *_datePickerView;
  MeasuringPCDatePickerShadowNode::ConcreteState::Shared _state;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<
      MeasuringPCDatePickerComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    _datePickerView = [PCDatePickerView new];
    _datePickerView.translatesAutoresizingMaskIntoConstraints = NO;

    __weak PCDatePicker *weakSelf = self;
    _datePickerView.onChangeHandler = ^(NSNumber *ms) {
      PCDatePicker *strongSelf = weakSelf;
      if (!strongSelf) {
        return;
      }

      // Build the OnConfirm payload the emitter expects
      PCDatePickerEventEmitter::OnConfirm event{};
      event.timestampMs = ms.doubleValue;

      strongSelf.eventEmitterTyped.onConfirm(event);
    };

    _datePickerView.onCancelHandler = ^{
      PCDatePicker *strongSelf = weakSelf;
      if (!strongSelf) {
        return;
      }

      PCDatePickerEventEmitter::OnCancel event{};
      strongSelf.eventEmitterTyped.onCancel(event);
    };

    self.contentView = _datePickerView;

    [NSLayoutConstraint activateConstraints:@[
      [_datePickerView.topAnchor
          constraintEqualToAnchor:self.contentView.topAnchor],
      [_datePickerView.bottomAnchor
          constraintEqualToAnchor:self.contentView.bottomAnchor],
      [_datePickerView.leadingAnchor
          constraintEqualToAnchor:self.contentView.leadingAnchor],
      [_datePickerView.trailingAnchor
          constraintEqualToAnchor:self.contentView.trailingAnchor],
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
           oldProps:(Props::Shared const &)oldProps {
  const auto &oldViewProps =
      *std::static_pointer_cast<PCDatePickerProps const>(_props);
  const auto &newViewProps =
      *std::static_pointer_cast<PCDatePickerProps const>(props);

  BOOL needsToUpdateMeasurements = NO;

  // Convert new prop to an NSString (or default)
  NSString *newPresentation =
      newViewProps.presentation.empty()
          ? @"modal"
          : [NSString stringWithUTF8String:newViewProps.presentation.c_str()];
  if (![_datePickerView.presentation isEqualToString:newPresentation]) {
    _datePickerView.presentation = newPresentation;
    needsToUpdateMeasurements = YES;
  }

  // --- visible -> open ---
  BOOL shouldOpen = (newViewProps.visible == "open");
  NSNumber *newValue = @(shouldOpen);
  if (![_datePickerView.open isEqual:newValue]) {
    _datePickerView.open = newValue;
  }

  // --- Controlled dateMs (sentinel -1 = "no value") ---
  if (oldViewProps.dateMs != newViewProps.dateMs) {
    if (newViewProps.dateMs >= 0) {
      _datePickerView.dateMs = @(newViewProps.dateMs);
    } else {
      _datePickerView.dateMs = nil;
    }
  }

  // --- minDateMs / maxDateMs (sentinel -1 = unbounded) ---
  if (oldViewProps.minDateMs != newViewProps.minDateMs) {
    if (newViewProps.minDateMs >= 0) {
      _datePickerView.minDateMs = @(newViewProps.minDateMs);
    } else {
      _datePickerView.minDateMs = nil;
    }
  }

  if (oldViewProps.maxDateMs != newViewProps.maxDateMs) {
    if (newViewProps.maxDateMs >= 0) {
      _datePickerView.maxDateMs = @(newViewProps.maxDateMs);
    } else {
      _datePickerView.maxDateMs = nil;
    }
  }

  // --- Locale ---
  if (oldViewProps.locale != newViewProps.locale) {
    if (!newViewProps.locale.empty()) {
      _datePickerView.localeIdentifier =
          [NSString stringWithUTF8String:newViewProps.locale.c_str()];
    } else {
      _datePickerView.localeIdentifier = nil;
    }
  }

  // --- Time zone ---
  if (oldViewProps.timeZoneName != newViewProps.timeZoneName) {
    if (!newViewProps.timeZoneName.empty()) {
      _datePickerView.timeZoneName =
          [NSString stringWithUTF8String:newViewProps.timeZoneName.c_str()];
    } else {
      _datePickerView.timeZoneName = nil;
    }
  }

  // mode: "date" | "time" | "dateAndTime" | "countDownTimer"
  if (oldViewProps.mode != newViewProps.mode) {
    if (!newViewProps.mode.empty()) {
      _datePickerView.mode =
          [NSString stringWithUTF8String:newViewProps.mode.c_str()];
    } else {
      _datePickerView.mode = @"date";
    }

    needsToUpdateMeasurements = YES;
  }

  // --- iOS-specific nested props ---
  const auto &oldIos = oldViewProps.ios;
  const auto &newIos = newViewProps.ios;

  // preferredStyle: "automatic" | "wheels" | "compact" | "inline"
  if (oldIos.preferredStyle != newIos.preferredStyle) {
    if (!newIos.preferredStyle.empty()) {
      _datePickerView.preferredStyle =
          [NSString stringWithUTF8String:newIos.preferredStyle.c_str()];
    } else {
      _datePickerView.preferredStyle = nil;
    }

    needsToUpdateMeasurements = YES;
  }

  // countDownDurationSeconds (Double)
  if (oldIos.countDownDurationSeconds != newIos.countDownDurationSeconds) {
    _datePickerView.countDownDurationSeconds =
        @(newIos.countDownDurationSeconds);
  }

  // minuteInterval (Int32)
  if (oldIos.minuteInterval != newIos.minuteInterval) {
    _datePickerView.minuteIntervalValue = @(newIos.minuteInterval);
  }

  // roundsToMinuteInterval (bool)
  if (oldIos.roundsToMinuteInterval != newIos.roundsToMinuteInterval) {
    _datePickerView.roundsToMinuteIntervalValue =
        @(newIos.roundsToMinuteInterval);
  }

  if (needsToUpdateMeasurements) {
    [self updateMeasurements];
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)updateLayoutMetrics:
            (const facebook::react::LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:
               (const facebook::react::LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  // Just fill whatever Yoga decided the content frame is.
  _datePickerView.frame = self.contentView.bounds;
}

- (void)updateState:(const facebook::react::State::Shared &)state
           oldState:(const facebook::react::State::Shared &)oldState {
  _state = std::static_pointer_cast<
      const MeasuringPCDatePickerShadowNode::ConcreteState>(state);

  if (oldState == nullptr) {
    // First time: compute initial size.
    [self updateMeasurements];
  }

  [super updateState:state oldState:oldState];
}

- (void)updateMeasurements {
  if (_state == nullptr) {
    return;
  }

  // Ask Swift view for intrinsic size. Use “compressed” constraints.
  CGSize size = [_datePickerView
      sizeForLayoutWithConstrainedTo:CGSizeMake(
                                         UILayoutFittingCompressedSize.width,
                                         UILayoutFittingCompressedSize.height)];

  // Guard against nonsense.
  if (size.width < 0 || size.height < 0) {
    return;
  }

  PCDatePickerStateFrameSize newState;
  newState.frameSize = {
      static_cast<Float>(size.width),
      static_cast<Float>(size.height),
  };

  _state->updateState(std::move(newState));
}

// Strongly-typed event emitter helper
- (const PCDatePickerEventEmitter &)eventEmitterTyped {
  return static_cast<const PCDatePickerEventEmitter &>(*_eventEmitter);
}

@end

// Factory hook for Fabric
Class<RCTComponentViewProtocol> RCTPCDatePickerCls(void) {
  return PCDatePicker.class;
}
