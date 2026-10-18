// PCChip.mm

#import "PCChip.h"

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

#import "PCChipComponentDescriptors-custom.h"
#import "PCChipShadowNode-custom.h"
#import "PCChipState-custom.h"

using namespace facebook::react;

namespace {
static inline NSString *NSStringFromStd(const std::string &s, NSString *fallback) {
  return s.empty() ? fallback : [NSString stringWithUTF8String:s.c_str()];
}

static inline bool IconEqual(const PCChipIconStruct &a, const PCChipIconStruct &b) {
  return a.iconType == b.iconType && a.iconName == b.iconName && a.iconRequest == b.iconRequest &&
         a.iconUri == b.iconUri && a.iconScale == b.iconScale && a.iconTinted == b.iconTinted;
}
} // namespace

@interface PCChip ()

- (void)updateMeasurements;

@end

@implementation PCChip {
  PCChipView *_view;
  MeasuringPCChipShadowNode::ConcreteState::Shared _state;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<MeasuringPCChipComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    // Fabric views seed _props with their own defaults: RCTViewComponentView
    // asserts on it in debug builds of React Native core, and the first
    // updateProps would otherwise read the base ViewProps as PCChipProps.
    static const auto defaultProps = std::make_shared<const PCChipProps>();
    _props = defaultProps;

    _view = [PCChipView new];
    self.contentView = _view;

    __weak __typeof(self) weakSelf = self;

    _view.onPress = ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      [strongSelf->_view.haptics performIn:strongSelf->_view];

      auto eventEmitter =
          std::static_pointer_cast<const PCChipEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onChipPress({});
    };

    _view.onClose = ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      [strongSelf->_view.haptics performIn:strongSelf->_view];

      auto eventEmitter =
          std::static_pointer_cast<const PCChipEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onChipClose({});
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
  const auto &newProps = *std::static_pointer_cast<const PCChipProps>(props);
  const auto prevProps = std::static_pointer_cast<const PCChipProps>(oldProps);

  if (!prevProps || newProps.label != prevProps->label) {
    _view.label = NSStringFromStd(newProps.label, @"");
  }

  // icon: {iconType, iconName, iconRequest, iconUri, iconScale, iconTinted}
  if (!prevProps || !IconEqual(newProps.icon, prevProps->icon)) {
    const auto &icon = newProps.icon;
    [_view setIconWithType:NSStringFromStd(icon.iconType, @"")
                      name:NSStringFromStd(icon.iconName, @"")
                   request:NSStringFromStd(icon.iconRequest, @"")
                       uri:NSStringFromStd(icon.iconUri, @"")
                     scale:icon.iconScale
                    tinted:(icon.iconTinted != "false")];
  }

  if (!prevProps || newProps.variant != prevProps->variant) {
    _view.variant = NSStringFromStd(newProps.variant, @"assist");
  }

  // selected: '' (not selectable) | 'true' | 'false'. The view shows only
  // the prop, so a press the parent didn't take changes nothing.
  if (!prevProps || newProps.selected != prevProps->selected) {
    _view.selected = NSStringFromStd(newProps.selected, @"");
  }

  if (!prevProps || newProps.closeIcon != prevProps->closeIcon) {
    _view.closeIcon = newProps.closeIcon == "true";
  }

  if (!prevProps || newProps.closeAccessibilityLabel != prevProps->closeAccessibilityLabel) {
    _view.closeAccessibilityLabel = NSStringFromStd(newProps.closeAccessibilityLabel, @"");
  }

  if (!prevProps || newProps.closeTestID != prevProps->closeTestID) {
    _view.closeTestID = NSStringFromStd(newProps.closeTestID, @"");
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

  [super updateProps:props oldProps:oldProps];

  // Update measurements when props change that affect layout
  [self updateMeasurements];
}

#pragma mark - State (Measuring)

- (void)updateState:(const State::Shared &)state
           oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<const MeasuringPCChipShadowNode::ConcreteState>(state);

  if (oldState == nullptr) {
    // First time: compute initial size.
    [self updateMeasurements];
  }

  [super updateState:state oldState:oldState];
}

- (void)updateMeasurements {
  if (_state == nullptr)
    return;

  // The chip's natural size; Yoga clamps it to the available width
  CGSize size = [_view sizeForLayoutWithConstrainedTo:CGSizeZero];

  PCChipStateFrameSize next;
  next.frameSize = {(Float)size.width, (Float)size.height};
  if (_state->getData() != next) {
    _state->updateState(std::move(next));
  }
}

@end

Class<RCTComponentViewProtocol> PCChipCls(void) {
  return PCChip.class;
}
