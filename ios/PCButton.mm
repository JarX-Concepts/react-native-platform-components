// PCButton.mm

#import "PCButton.h"

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

#import "PCButtonComponentDescriptors-custom.h"
#import "PCButtonShadowNode-custom.h"
#import "PCButtonState-custom.h"

using namespace facebook::react;

namespace {
static inline NSString *NSStringFromStd(const std::string &s, NSString *fallback) {
  return s.empty() ? fallback : [NSString stringWithUTF8String:s.c_str()];
}

static inline bool IconEqual(const PCButtonIconStruct &a, const PCButtonIconStruct &b) {
  return a.iconType == b.iconType && a.iconName == b.iconName && a.iconUri == b.iconUri &&
         a.iconScale == b.iconScale && a.iconTinted == b.iconTinted;
}

static inline bool LabelStyleEqual(
    const PCButtonLabelStyleStruct &a,
    const PCButtonLabelStyleStruct &b) {
  return a.fontFamily == b.fontFamily && a.fontSize == b.fontSize &&
         a.fontWeight == b.fontWeight && a.fontStyle == b.fontStyle;
}

/// Builds the label font from RN-style font props, or nil when every field is
/// unset so the button keeps the configuration's font. Without a fontSize the
/// size follows Dynamic Type (the body style), capped at maxFontSizeMultiplier
/// times its default size when that is 1 or more.
static UIFont *FontFromLabelStyle(const PCButtonLabelStyleStruct &style, double maxFontSizeMultiplier) {
  if (style.fontFamily.empty() && style.fontSize <= 0 &&
      style.fontWeight.empty() && style.fontStyle.empty()) {
    return nil;
  }
  // UIButton titles default to the body text style; start there so a lone
  // fontWeight or fontStyle doesn't change the size.
  UIFont *body = [UIFont preferredFontForTextStyle:UIFontTextStyleBody];
  NSNumber *size = style.fontSize > 0 ? @(style.fontSize) : nil;
  if (!size && maxFontSizeMultiplier >= 1) {
    UITraitCollection *defaultTraits =
        [UITraitCollection traitCollectionWithPreferredContentSizeCategory:UIContentSizeCategoryLarge];
    CGFloat baseSize = [UIFont preferredFontForTextStyle:UIFontTextStyleBody
                           compatibleWithTraitCollection:defaultTraits].pointSize;
    size = @(MIN(body.pointSize, baseSize * maxFontSizeMultiplier));
  }
  return [RCTFont updateFont:body
                  withFamily:NSStringFromStd(style.fontFamily, nil)
                        size:size
                      weight:NSStringFromStd(style.fontWeight, nil)
                       style:NSStringFromStd(style.fontStyle, nil)
                     variant:nil
             scaleMultiplier:1.0];
}
} // namespace

@interface PCButton ()

- (void)updateMeasurements;

@end

@implementation PCButton {
  PCButtonView *_view;
  MeasuringPCButtonShadowNode::ConcreteState::Shared _state;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<MeasuringPCButtonComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    // Fabric views seed _props with their own defaults: RCTViewComponentView
    // asserts on it in debug builds of React Native core, and the first
    // updateProps would otherwise read the base ViewProps as PCButtonProps.
    static const auto defaultProps = std::make_shared<const PCButtonProps>();
    _props = defaultProps;

    _view = [PCButtonView new];
    self.contentView = _view;

    __weak __typeof(self) weakSelf = self;

    _view.onPress = ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      [strongSelf->_view.haptics performIn:strongSelf->_view];

      auto eventEmitter =
          std::static_pointer_cast<const PCButtonEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onButtonPress({});
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
  const auto &newProps = *std::static_pointer_cast<const PCButtonProps>(props);
  const auto prevProps = std::static_pointer_cast<const PCButtonProps>(oldProps);

  if (!prevProps || newProps.label != prevProps->label) {
    _view.label = NSStringFromStd(newProps.label, @"");
  }

  // icon: {iconType, iconName, iconUri, iconScale, iconTinted}
  if (!prevProps || !IconEqual(newProps.icon, prevProps->icon)) {
    const auto &icon = newProps.icon;
    [_view setIconWithType:NSStringFromStd(icon.iconType, @"")
                      name:NSStringFromStd(icon.iconName, @"")
                       uri:NSStringFromStd(icon.iconUri, @"")
                     scale:icon.iconScale
                    tinted:(icon.iconTinted != "false")];
  }

  if (!prevProps || newProps.iconPosition != prevProps->iconPosition) {
    _view.iconPosition = NSStringFromStd(newProps.iconPosition, @"leading");
  }

  if (!prevProps || newProps.variant != prevProps->variant) {
    _view.variant = NSStringFromStd(newProps.variant, @"filled");
  }

  if (!prevProps || newProps.size != prevProps->size) {
    _view.size = NSStringFromStd(newProps.size, @"small");
  }

  if (!prevProps || newProps.shape != prevProps->shape) {
    _view.shape = NSStringFromStd(newProps.shape, @"");
  }

  if (!prevProps || newProps.cornerRadius != prevProps->cornerRadius) {
    _view.cornerRadius = newProps.cornerRadius;
  }

  if (!prevProps || newProps.interactivity != prevProps->interactivity) {
    _view.interactivity = NSStringFromStd(newProps.interactivity, @"enabled");
  }

  if (!prevProps || newProps.loading != prevProps->loading) {
    _view.loading = newProps.loading == "true";
  }

  // Colors arrive as SharedColor (already processed by React Native)
  if (!prevProps || newProps.color != prevProps->color) {
    _view.containerColor = RCTUIColorFromSharedColor(newProps.color);
  }

  if (!prevProps || newProps.foregroundColor != prevProps->foregroundColor) {
    _view.foregroundColor = RCTUIColorFromSharedColor(newProps.foregroundColor);
  }

  if (!prevProps || newProps.disabledColor != prevProps->disabledColor) {
    _view.disabledContainerColor = RCTUIColorFromSharedColor(newProps.disabledColor);
  }

  if (!prevProps || newProps.disabledForegroundColor != prevProps->disabledForegroundColor) {
    _view.disabledForegroundColor = RCTUIColorFromSharedColor(newProps.disabledForegroundColor);
  }

  // labelStyle: {fontFamily, fontSize, fontWeight, fontStyle}
  if (!prevProps || !LabelStyleEqual(newProps.labelStyle, prevProps->labelStyle) ||
      newProps.maxFontSizeMultiplier != prevProps->maxFontSizeMultiplier) {
    _view.labelFont = FontFromLabelStyle(newProps.labelStyle, newProps.maxFontSizeMultiplier);
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

  // androidRippleColor / androidStrokeColor: Android only

  [super updateProps:props oldProps:oldProps];

  // Update measurements when props change that affect layout
  [self updateMeasurements];
}

#pragma mark - State (Measuring)

- (void)updateState:(const State::Shared &)state
           oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<const MeasuringPCButtonShadowNode::ConcreteState>(state);

  if (oldState == nullptr) {
    // First time: compute initial size.
    [self updateMeasurements];
  }

  [super updateState:state oldState:oldState];
}

- (void)updateMeasurements {
  if (_state == nullptr)
    return;

  // The button's natural size; Yoga clamps it to the available width
  CGSize size = [_view sizeForLayoutWithConstrainedTo:CGSizeZero];

  PCButtonStateFrameSize next;
  next.frameSize = {(Float)size.width, (Float)size.height};
  _state->updateState(std::move(next));
}

@end

Class<RCTComponentViewProtocol> PCButtonCls(void) {
  return PCButton.class;
}
