// ios/DatePicker.mm

#import "DatePicker.h"

#import <react/renderer/components/PlatformComponentsViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#import <react/renderer/components/PlatformComponentsViewSpec/Props.h>
#import <react/renderer/components/PlatformComponentsViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"
#import "PlatformComponents-Swift.h"

using namespace facebook::react;

@interface DatePicker () <RCTDatePickerViewProtocol>
@end

@implementation DatePicker {
  DatePickerView *_datePickerView;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<DatePickerComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _datePickerView = [DatePickerView new];
    _datePickerView.translatesAutoresizingMaskIntoConstraints = NO;

    __weak DatePicker *weakSelf = self;
    _datePickerView.onChangeHandler = ^(NSNumber *ms) {
      DatePicker *strongSelf = weakSelf;
      if (!strongSelf) {
        return;
      }

      // Build the OnConfirm payload the emitter expects
      DatePickerEventEmitter::OnConfirm event{};
      event.timestampMs = ms.doubleValue;
      
      strongSelf.eventEmitterTyped.onConfirm(event);
    };

    _datePickerView.onCancelHandler = ^{
        DatePicker *strongSelf = weakSelf;
        if (!strongSelf) {
            return;
        }

        DatePickerEventEmitter::OnCancel event{};
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

#pragma mark - Props

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps
{
  const auto &oldViewProps =
      *std::static_pointer_cast<DatePickerProps const>(_props);
  const auto &newViewProps =
      *std::static_pointer_cast<DatePickerProps const>(props);

  // --- Controlled dateMs (sentinel -1 = "no value") ---
  if (oldViewProps.dateMs != newViewProps.dateMs) {
    if (newViewProps.dateMs >= 0) {
      _datePickerView.dateMs = @(newViewProps.dateMs);
    } else {
      _datePickerView.dateMs = nil;
    }
  }

  // --- visible -> open ---
  if (oldViewProps.visible != newViewProps.visible) {
    _datePickerView.open = @(newViewProps.visible);
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

  // --- iOS-specific nested props ---
  const auto &oldIos = oldViewProps.ios;
  const auto &newIos = newViewProps.ios;

  // mode: "date" | "time" | "dateAndTime" | "countDownTimer"
  if (oldIos.mode != newIos.mode) {
    if (!newIos.mode.empty()) {
      _datePickerView.mode =
          [NSString stringWithUTF8String:newIos.mode.c_str()];
    } else {
      _datePickerView.mode = @"date";
    }
  }

  // preferredStyle: "automatic" | "wheels" | "compact" | "inline"
  if (oldIos.preferredStyle != newIos.preferredStyle) {
    if (!newIos.preferredStyle.empty()) {
      _datePickerView.preferredStyle =
          [NSString stringWithUTF8String:newIos.preferredStyle.c_str()];
    } else {
      _datePickerView.preferredStyle = nil;
    }
  }

  // countDownDurationSeconds (Double)
  if (oldIos.countDownDurationSeconds != newIos.countDownDurationSeconds) {
    _datePickerView.countDownDurationSeconds =
        @(newIos.countDownDurationSeconds);
  }

  // minuteInterval (Int32)
  if (oldIos.minuteInterval != newIos.minuteInterval) {
    _datePickerView.minuteIntervalValue =
        @(newIos.minuteInterval);
  }

  // roundsToMinuteInterval (bool)
  if (oldIos.roundsToMinuteInterval != newIos.roundsToMinuteInterval) {
    _datePickerView.roundsToMinuteIntervalValue =
        @(newIos.roundsToMinuteInterval);
  }

  [super updateProps:props oldProps:oldProps];
}

// Strongly-typed event emitter helper
- (const DatePickerEventEmitter &)eventEmitterTyped {
  return static_cast<const DatePickerEventEmitter &>(*_eventEmitter);
}

@end

// Factory hook for Fabric
Class<RCTComponentViewProtocol> RCTDatePickerCls(void) {
  return DatePicker.class;
}
