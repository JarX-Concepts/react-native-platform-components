// PCFloatingActionButton.mm

#import "PCFloatingActionButton.h"

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

#import "PCFloatingActionButtonComponentDescriptors-custom.h"
#import "PCFloatingActionButtonShadowNode-custom.h"
#import "PCFloatingActionButtonState-custom.h"

using namespace facebook::react;

namespace {
static inline NSString *NSStringFromStd(const std::string &s, NSString *fallback) {
  return s.empty() ? fallback : [NSString stringWithUTF8String:s.c_str()];
}

static inline bool IconEqual(
    const PCFloatingActionButtonIconStruct &a,
    const PCFloatingActionButtonIconStruct &b) {
  return a.iconType == b.iconType && a.iconName == b.iconName && a.iconUri == b.iconUri &&
         a.iconScale == b.iconScale && a.iconTinted == b.iconTinted;
}
} // namespace

@interface PCFloatingActionButton ()

- (void)updateMeasurements;

@end

@implementation PCFloatingActionButton {
  PCFloatingActionButtonView *_view;
  MeasuringPCFloatingActionButtonShadowNode::ConcreteState::Shared _state;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<MeasuringPCFloatingActionButtonComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    // Fabric views seed _props with their own defaults: RCTViewComponentView
    // asserts on it in debug builds of React Native core, and the first
    // updateProps would otherwise read the base ViewProps as the component's.
    static const auto defaultProps = std::make_shared<const PCFloatingActionButtonProps>();
    _props = defaultProps;

    _view = [PCFloatingActionButtonView new];
    self.contentView = _view;

    __weak __typeof(self) weakSelf = self;

    _view.onPress = ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter = std::static_pointer_cast<const PCFloatingActionButtonEventEmitter>(
          strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onFabPress({});
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
  const auto &newProps = *std::static_pointer_cast<const PCFloatingActionButtonProps>(props);
  const auto prevProps = std::static_pointer_cast<const PCFloatingActionButtonProps>(oldProps);

  // icon: {iconType, iconName, iconUri, iconScale, iconTinted}
  if (!prevProps || !IconEqual(newProps.icon, prevProps->icon)) {
    const auto &icon = newProps.icon;
    [_view setIconWithType:NSStringFromStd(icon.iconType, @"")
                      name:NSStringFromStd(icon.iconName, @"")
                       uri:NSStringFromStd(icon.iconUri, @"")
                     scale:icon.iconScale
                    tinted:(icon.iconTinted != "false")];
  }

  if (!prevProps || newProps.size != prevProps->size) {
    _view.size = NSStringFromStd(newProps.size, @"regular");
  }

  // extended before the label, which shows in the state it gives
  if (!prevProps || newProps.extended != prevProps->extended) {
    _view.extended = newProps.extended != "false";
  }

  if (!prevProps || newProps.label != prevProps->label) {
    _view.label = NSStringFromStd(newProps.label, @"");
  }

  // Colors arrive as SharedColor (already processed by React Native)
  if (!prevProps || newProps.color != prevProps->color) {
    _view.containerColor = RCTUIColorFromSharedColor(newProps.color);
  }

  if (!prevProps || newProps.foregroundColor != prevProps->foregroundColor) {
    _view.foregroundColor = RCTUIColorFromSharedColor(newProps.foregroundColor);
  }

  if (!prevProps || newProps.interactivity != prevProps->interactivity) {
    _view.interactivity = NSStringFromStd(newProps.interactivity, @"enabled");
  }

  if (!prevProps || newProps.spokenLabel != prevProps->spokenLabel) {
    _view.spokenLabel = NSStringFromStd(newProps.spokenLabel, @"");
  }

  if (!prevProps || newProps.scrollViewNativeID != prevProps->scrollViewNativeID) {
    _view.scrollViewNativeID = NSStringFromStd(newProps.scrollViewNativeID, @"");
  }

  [super updateProps:props oldProps:oldProps];

  [self updateMeasurements];
}

#pragma mark - State (Measuring)

- (void)updateState:(const State::Shared &)state
           oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<const MeasuringPCFloatingActionButtonShadowNode::ConcreteState>(state);

  if (oldState == nullptr) {
    [self updateMeasurements];
  }

  [super updateState:state oldState:oldState];
}

- (void)updateMeasurements {
  if (_state == nullptr) return;

  CGSize size = [_view sizeForLayoutWithConstrainedTo:CGSizeZero];

  PCFloatingActionButtonStateFrameSize next;
  next.frameSize = {(Float)size.width, (Float)size.height};
  if (_state->getData() != next) {
    _state->updateState(std::move(next));
  }
}

@end

Class<RCTComponentViewProtocol> PCFloatingActionButtonCls(void) {
  return PCFloatingActionButton.class;
}
