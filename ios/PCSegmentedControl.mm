// PCSegmentedControl.mm

#import "PCSegmentedControl.h"

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

static inline bool LabelStyleEqual(
    const facebook::react::PCSegmentedControlLabelStyleStruct &a,
    const facebook::react::PCSegmentedControlLabelStyleStruct &b) {
  return a.fontFamily == b.fontFamily && a.fontSize == b.fontSize &&
         a.fontWeight == b.fontWeight && a.fontStyle == b.fontStyle;
}

/// Builds the label font from RN-style font props, or nil when every field is
/// unset so the control keeps the system font.
static UIFont *FontFromLabelStyle(
    const facebook::react::PCSegmentedControlLabelStyleStruct &style) {
  if (style.fontFamily.empty() && style.fontSize <= 0 &&
      style.fontWeight.empty() && style.fontStyle.empty()) {
    return nil;
  }
  // UISegmentedControl titles default to 13pt; start there so a lone
  // fontWeight or fontStyle doesn't change the size.
  return [RCTFont updateFont:[UIFont systemFontOfSize:13]
                  withFamily:NSStringFromStd(style.fontFamily, nil)
                        size:style.fontSize > 0 ? @(style.fontSize) : nil
                      weight:NSStringFromStd(style.fontWeight, nil)
                       style:NSStringFromStd(style.fontStyle, nil)
                     variant:nil
             scaleMultiplier:1.0];
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
  const auto &newProps =
      *std::static_pointer_cast<const PCSegmentedControlProps>(props);
  const auto prevProps =
      std::static_pointer_cast<const PCSegmentedControlProps>(oldProps);

  // segments: [{label, value, disabled, iconType, iconName, iconUri, iconScale,
  //             iconTinted, accessibilityLabel}]
  if (!prevProps || !SegmentsEqual(newProps.segments, prevProps->segments)) {
    NSMutableArray *arr = [NSMutableArray new];
    for (const auto &seg : newProps.segments) {
      [arr addObject:@{
        @"label": NSStringFromStd(seg.label, @""),
        @"value": NSStringFromStd(seg.value, @""),
        @"disabled": NSStringFromStd(seg.disabled, @"enabled"),
        @"iconType": NSStringFromStd(seg.iconType, @""),
        @"iconName": NSStringFromStd(seg.iconName, @""),
        @"iconUri": NSStringFromStd(seg.iconUri, @""),
        @"iconScale": @(seg.iconScale),
        @"iconTinted": NSStringFromStd(seg.iconTinted, @"true"),
        @"accessibilityLabel": NSStringFromStd(seg.accessibilityLabel, @""),
      }];
    }
    _view.segments = arr;
  }

  // labelVisibility: "auto" | "labeled" | "unlabeled"
  if (!prevProps || newProps.labelVisibility != prevProps->labelVisibility) {
    _view.labelVisibility = NSStringFromStd(newProps.labelVisibility, @"auto");
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

  // Colors arrive as SharedColor (already processed by React Native)
  if (!prevProps || newProps.selectedSegmentColor != prevProps->selectedSegmentColor) {
    _view.selectedSegmentColor = RCTUIColorFromSharedColor(newProps.selectedSegmentColor);
  }

  if (!prevProps || newProps.activeTintColor != prevProps->activeTintColor) {
    _view.activeTintColor = RCTUIColorFromSharedColor(newProps.activeTintColor);
  }

  if (!prevProps || newProps.inactiveTintColor != prevProps->inactiveTintColor) {
    _view.inactiveTintColor = RCTUIColorFromSharedColor(newProps.inactiveTintColor);
  }

  // labelStyle: {fontFamily, fontSize, fontWeight, fontStyle}
  if (!prevProps || !LabelStyleEqual(newProps.labelStyle, prevProps->labelStyle)) {
    _view.labelFont = FontFromLabelStyle(newProps.labelStyle);
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
