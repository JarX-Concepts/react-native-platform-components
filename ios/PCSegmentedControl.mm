// PCSegmentedControl.mm

#import "PCSegmentedControl.h"

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

#import "PCSegmentedControlComponentDescriptors-custom.h"
#import "PCSegmentedControlShadowNode-custom.h"
#import "PCSegmentedControlState-custom.h"

using namespace facebook::react;

namespace {
static inline bool SegmentsEqual(
    const std::vector<facebook::react::PCSegmentedControlSegmentsStruct> &a,
    const std::vector<facebook::react::PCSegmentedControlSegmentsStruct> &b) {
  if (a.size() != b.size()) return false;
  for (size_t i = 0; i < a.size(); i++) {
    if (a[i].label != b[i].label) return false;
    if (a[i].value != b[i].value) return false;
    if (a[i].disabled != b[i].disabled) return false;
    if (a[i].icon != b[i].icon) return false;
  }
  return true;
}
} // namespace

@interface PCSegmentedControl ()

- (void)updateMeasurements;

@end

@implementation PCSegmentedControl {
  PCSegmentedControlView *_view;
  MeasuringPCSegmentedControlShadowNode::ConcreteState::Shared _state;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<
      MeasuringPCSegmentedControlComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    _view = [PCSegmentedControlView new];
    self.contentView = _view;

    __weak __typeof(self) weakSelf = self;

    _view.onSelect = ^(NSInteger index, NSString *value) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCSegmentedControlEventEmitter>(
              strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      PCSegmentedControlEventEmitter::OnSelect payload = {
          .index = (int)index,
          .value = value.UTF8String,
      };

      eventEmitter->onSelect(payload);
    };
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
  const auto &newProps =
      *std::static_pointer_cast<const PCSegmentedControlProps>(props);
  const auto prevProps =
      std::static_pointer_cast<const PCSegmentedControlProps>(oldProps);

  // segments: [{label, value, disabled, icon}]
  if (!prevProps || !SegmentsEqual(newProps.segments, prevProps->segments)) {
    NSMutableArray *arr = [NSMutableArray new];
    for (const auto &seg : newProps.segments) {
      NSString *label = seg.label.empty()
                            ? @""
                            : [NSString stringWithUTF8String:seg.label.c_str()];
      NSString *value = seg.value.empty()
                            ? @""
                            : [NSString stringWithUTF8String:seg.value.c_str()];
      NSString *disabled = seg.disabled.empty()
                               ? @"enabled"
                               : [NSString stringWithUTF8String:seg.disabled.c_str()];
      NSString *icon = seg.icon.empty()
                           ? @""
                           : [NSString stringWithUTF8String:seg.icon.c_str()];
      [arr addObject:@{
        @"label": label,
        @"value": value,
        @"disabled": disabled,
        @"icon": icon
      }];
    }
    _view.segments = arr;
  }

  // selectedValue (default "")
  if (!prevProps || newProps.selectedValue != prevProps->selectedValue) {
    if (!newProps.selectedValue.empty()) {
      _view.selectedValue =
          [NSString stringWithUTF8String:newProps.selectedValue.c_str()];
    } else {
      _view.selectedValue = @""; // sentinel for no selection
    }
  }

  // interactivity: "enabled" | "disabled"
  if (!prevProps || newProps.interactivity != prevProps->interactivity) {
    if (!newProps.interactivity.empty()) {
      _view.interactivity =
          [NSString stringWithUTF8String:newProps.interactivity.c_str()];
    } else {
      _view.interactivity = @"enabled";
    }
  }

  // iOS-specific props
  const auto &newIos = newProps.ios;
  const auto &oldIos =
      prevProps ? prevProps->ios : PCSegmentedControlIosStruct{};

  if (!prevProps || newIos.momentary != oldIos.momentary) {
    _view.momentary = (newIos.momentary == "true");
  }

  if (!prevProps || newIos.apportionsSegmentWidthsByContent != oldIos.apportionsSegmentWidthsByContent) {
    _view.apportionsSegmentWidthsByContent = (newIos.apportionsSegmentWidthsByContent == "true");
  }

  if (!prevProps || newIos.selectedSegmentTintColor != oldIos.selectedSegmentTintColor) {
    if (!newIos.selectedSegmentTintColor.empty()) {
      _view.selectedSegmentTintColor =
          [NSString stringWithUTF8String:newIos.selectedSegmentTintColor.c_str()];
    } else {
      _view.selectedSegmentTintColor = nil;
    }
  }

  [super updateProps:props oldProps:oldProps];

  // Update measurements when props change that affect layout
  [self updateMeasurements];
}

#pragma mark - State (Measuring)

- (void)updateState:(const State::Shared &)state
           oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<
      const MeasuringPCSegmentedControlShadowNode::ConcreteState>(state);

  if (oldState == nullptr) {
    // First time: compute initial size.
    [self updateMeasurements];
  }

  [super updateState:state oldState:oldState];
}

- (void)updateMeasurements {
  if (_state == nullptr)
    return;

  // Use the real width Yoga gave us
  const CGFloat w = self.bounds.size.width > 1 ? self.bounds.size.width : 320;

  CGSize size = [_view sizeForLayoutWithConstrainedTo:CGSizeMake(w, 0)];

  PCSegmentedControlStateFrameSize next;
  next.frameSize = {(Float)size.width, (Float)size.height};
  _state->updateState(std::move(next));
}

@end
