// PCTextField.mm

#import "PCTextField.h"

#import <React/RCTComponentViewFactory.h>
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>
#import <React/RCTFont.h>

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

#import "PCTextFieldComponentDescriptors-custom.h"
#import "PCTextFieldShadowNode-custom.h"
#import "PCTextFieldState-custom.h"

using namespace facebook::react;

namespace {
static inline NSString *NSStringFromStd(const std::string &s, NSString *fallback) {
  return s.empty() ? fallback : [NSString stringWithUTF8String:s.c_str()];
}

static inline bool IconEqual(const PCTextFieldLeadingIconStruct &a, const PCTextFieldLeadingIconStruct &b) {
  return a.iconType == b.iconType && a.iconName == b.iconName && a.iconUri == b.iconUri &&
         a.iconScale == b.iconScale && a.iconTinted == b.iconTinted;
}

static inline bool IconEqual(const PCTextFieldTrailingIconStruct &a, const PCTextFieldTrailingIconStruct &b) {
  return a.iconType == b.iconType && a.iconName == b.iconName && a.iconUri == b.iconUri &&
         a.iconScale == b.iconScale && a.iconTinted == b.iconTinted;
}

static inline bool TextStyleEqual(
    const PCTextFieldTextStyleStruct &a,
    const PCTextFieldTextStyleStruct &b) {
  return a.fontFamily == b.fontFamily && a.fontSize == b.fontSize &&
         a.fontWeight == b.fontWeight && a.fontStyle == b.fontStyle;
}

/// Builds the input font from RN-style font props, or nil when every field is
/// unset so the field keeps the body text style.
static UIFont *FontFromTextStyle(const PCTextFieldTextStyleStruct &style) {
  if (style.fontFamily.empty() && style.fontSize <= 0 &&
      style.fontWeight.empty() && style.fontStyle.empty()) {
    return nil;
  }
  return [RCTFont updateFont:[UIFont preferredFontForTextStyle:UIFontTextStyleBody]
                  withFamily:NSStringFromStd(style.fontFamily, nil)
                        size:style.fontSize > 0 ? @(style.fontSize) : nil
                      weight:NSStringFromStd(style.fontWeight, nil)
                       style:NSStringFromStd(style.fontStyle, nil)
                     variant:nil
             scaleMultiplier:1.0];
}
} // namespace

@interface PCTextField () <RCTPCTextFieldViewProtocol>

- (void)updateMeasurements;

@end

@implementation PCTextField {
  PCTextFieldView *_view;
  MeasuringPCTextFieldShadowNode::ConcreteState::Shared _state;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<MeasuringPCTextFieldComponentDescriptor>();
}

// A first responder with typed text is not something to hand to another
// element; keep every field its own view.
+ (BOOL)shouldBeRecycled {
  return NO;
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    _view = [PCTextFieldView new];
    self.contentView = _view;

    __weak __typeof(self) weakSelf = self;

    _view.onChange = ^(NSString *text, NSInteger eventCount) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCTextFieldEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      PCTextFieldEventEmitter::OnFieldChange payload = {
          .text = text.UTF8String,
          .eventCount = (int)eventCount,
      };
      eventEmitter->onFieldChange(payload);
    };

    _view.onFocusChange = ^(BOOL focused, NSString *text) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCTextFieldEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      if (focused) {
        eventEmitter->onFieldFocus({.text = text.UTF8String});
      } else {
        eventEmitter->onFieldBlur({.text = text.UTF8String});
      }
    };

    _view.onSubmit = ^(NSString *text) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCTextFieldEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onFieldSubmit({.text = text.UTF8String});
    };

    _view.onTrailingIconPress = ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCTextFieldEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onTrailingIconPress({});
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
  const auto &newProps = *std::static_pointer_cast<const PCTextFieldProps>(props);
  const auto prevProps = std::static_pointer_cast<const PCTextFieldProps>(oldProps);

  // Only the first value counts; later text arrives through setText
  if (!prevProps || newProps.initialText != prevProps->initialText) {
    [_view applyInitialText:NSStringFromStd(newProps.initialText, @"")];
  }

  if (!prevProps || newProps.label != prevProps->label) {
    _view.label = NSStringFromStd(newProps.label, @"");
  }

  if (!prevProps || newProps.placeholder != prevProps->placeholder) {
    _view.placeholder = NSStringFromStd(newProps.placeholder, @"");
  }

  if (!prevProps || newProps.supportingText != prevProps->supportingText) {
    _view.supportingText = NSStringFromStd(newProps.supportingText, @"");
  }

  if (!prevProps || newProps.errorState != prevProps->errorState) {
    _view.errorState = NSStringFromStd(newProps.errorState, @"none");
  }

  if (!prevProps || newProps.errorText != prevProps->errorText) {
    _view.errorText = NSStringFromStd(newProps.errorText, @"");
  }

  if (!prevProps || newProps.prefix != prevProps->prefix) {
    _view.prefix = NSStringFromStd(newProps.prefix, @"");
  }

  if (!prevProps || newProps.suffix != prevProps->suffix) {
    _view.suffix = NSStringFromStd(newProps.suffix, @"");
  }

  // icons: {iconType, iconName, iconUri, iconScale, iconTinted}
  if (!prevProps || !IconEqual(newProps.leadingIcon, prevProps->leadingIcon)) {
    const auto &icon = newProps.leadingIcon;
    [_view setLeadingIconWithType:NSStringFromStd(icon.iconType, @"")
                             name:NSStringFromStd(icon.iconName, @"")
                              uri:NSStringFromStd(icon.iconUri, @"")
                            scale:icon.iconScale
                           tinted:(icon.iconTinted != "false")];
  }

  if (!prevProps || !IconEqual(newProps.trailingIcon, prevProps->trailingIcon)) {
    const auto &icon = newProps.trailingIcon;
    [_view setTrailingIconWithType:NSStringFromStd(icon.iconType, @"")
                              name:NSStringFromStd(icon.iconName, @"")
                               uri:NSStringFromStd(icon.iconUri, @"")
                             scale:icon.iconScale
                            tinted:(icon.iconTinted != "false")];
  }

  if (!prevProps || newProps.clearButtonMode != prevProps->clearButtonMode) {
    _view.clearButtonMode = NSStringFromStd(newProps.clearButtonMode, @"never");
  }

  if (!prevProps || newProps.passwordToggle != prevProps->passwordToggle) {
    _view.passwordToggle = newProps.passwordToggle == "shown";
  }

  if (!prevProps || newProps.characterCount != prevProps->characterCount) {
    _view.characterCount = newProps.characterCount == "shown";
  }

  if (!prevProps || newProps.maxLength != prevProps->maxLength) {
    _view.maxLength = newProps.maxLength;
  }

  if (!prevProps || newProps.keyboardType != prevProps->keyboardType) {
    _view.keyboardType = NSStringFromStd(newProps.keyboardType, @"default");
  }

  if (!prevProps || newProps.returnKeyType != prevProps->returnKeyType) {
    _view.returnKeyType = NSStringFromStd(newProps.returnKeyType, @"default");
  }

  if (!prevProps || newProps.autoCapitalize != prevProps->autoCapitalize) {
    _view.autoCapitalize = NSStringFromStd(newProps.autoCapitalize, @"sentences");
  }

  if (!prevProps || newProps.autoCorrect != prevProps->autoCorrect) {
    _view.autoCorrect = newProps.autoCorrect != "disabled";
  }

  if (!prevProps || newProps.secureTextEntry != prevProps->secureTextEntry) {
    _view.secureTextEntry = newProps.secureTextEntry == "secure";
  }

  if (!prevProps || newProps.lines != prevProps->lines) {
    _view.multiline = newProps.lines == "multiline";
  }

  if (!prevProps || newProps.interactivity != prevProps->interactivity) {
    _view.interactivity = NSStringFromStd(newProps.interactivity, @"enabled");
  }

  if (!prevProps || newProps.selectTextOnFocus != prevProps->selectTextOnFocus) {
    _view.selectTextOnFocus = newProps.selectTextOnFocus == "select";
  }

  if (!prevProps || newProps.autoComplete != prevProps->autoComplete) {
    _view.autoComplete = NSStringFromStd(newProps.autoComplete, @"");
  }

  if (!prevProps || newProps.keyboardAppearance != prevProps->keyboardAppearance) {
    _view.keyboardAppearance = NSStringFromStd(newProps.keyboardAppearance, @"default");
  }

  // textStyle: {fontFamily, fontSize, fontWeight, fontStyle}
  if (!prevProps || !TextStyleEqual(newProps.textStyle, prevProps->textStyle)) {
    _view.textFont = FontFromTextStyle(newProps.textStyle);
  }

  if (!prevProps || newProps.spokenLabel != prevProps->spokenLabel) {
    _view.spokenLabel = NSStringFromStd(newProps.spokenLabel, @"");
  }

  // ios: the text traits
  const auto &newIOS = newProps.ios;
  const auto &oldIOS = prevProps ? prevProps->ios : PCTextFieldIosStruct{};
  if (!prevProps || newIOS.writingTools != oldIOS.writingTools) {
    _view.writingTools = NSStringFromStd(newIOS.writingTools, @"");
  }
  if (!prevProps || newIOS.inlinePrediction != oldIOS.inlinePrediction) {
    _view.inlinePrediction = NSStringFromStd(newIOS.inlinePrediction, @"");
  }
  if (!prevProps || newIOS.smartQuotes != oldIOS.smartQuotes) {
    _view.smartQuotes = NSStringFromStd(newIOS.smartQuotes, @"");
  }
  if (!prevProps || newIOS.smartDashes != oldIOS.smartDashes) {
    _view.smartDashes = NSStringFromStd(newIOS.smartDashes, @"");
  }
  if (!prevProps || newIOS.smartInsertDelete != oldIOS.smartInsertDelete) {
    _view.smartInsertDelete = NSStringFromStd(newIOS.smartInsertDelete, @"");
  }
  if (!prevProps || newIOS.mathExpressionCompletion != oldIOS.mathExpressionCompletion) {
    _view.mathExpressionCompletion = NSStringFromStd(newIOS.mathExpressionCompletion, @"");
  }
  if (!prevProps || newIOS.borderStyle != oldIOS.borderStyle) {
    _view.borderStyle = NSStringFromStd(newIOS.borderStyle, @"");
  }
  if (!prevProps || newIOS.labelPlacement != oldIOS.labelPlacement) {
    _view.labelPlacement = NSStringFromStd(newIOS.labelPlacement, @"");
  }
  if (!prevProps || newIOS.labelWidth != oldIOS.labelWidth) {
    _view.labelWidth = newIOS.labelWidth;
  }

  // autoFocus last, once the field is configured
  if (!prevProps || newProps.autoFocus != prevProps->autoFocus) {
    _view.autoFocus = newProps.autoFocus == "focus";
  }

  // android: Android only

  [super updateProps:props oldProps:oldProps];

  // Update measurements when props change that affect layout
  [self updateMeasurements];
}

- (void)prepareForRecycle {
  [super prepareForRecycle];
  [_view resetForRecycle];
}

#pragma mark - Commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args {
  RCTPCTextFieldHandleCommand(self, commandName, args);
}

- (void)focus {
  [_view focus];
}

- (void)blur {
  [_view blur];
}

- (void)clear {
  [_view clear];
}

- (void)setText:(NSInteger)eventCount text:(NSString *)text {
  [_view setText:text ?: @"" eventCount:eventCount];
}

#pragma mark - State (Measuring)

- (void)updateState:(const State::Shared &)state
           oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<const MeasuringPCTextFieldShadowNode::ConcreteState>(state);

  if (oldState == nullptr) {
    // First time: compute initial size.
    [self updateMeasurements];
  }

  [super updateState:state oldState:oldState];
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
  // A new width changes how multi-line text and supporting text wrap
  if (layoutMetrics.frame.size.width != oldLayoutMetrics.frame.size.width) {
    [self updateMeasurements];
  }
}

- (void)updateMeasurements {
  if (_state == nullptr)
    return;

  // The height the field needs at its current width; the width itself is
  // whatever Yoga offers (see the shadow node).
  CGSize size = [_view sizeForLayoutWithConstrainedTo:CGSizeMake(self.bounds.size.width, 0)];

  PCTextFieldStateFrameSize next;
  next.frameSize = {(Float)size.width, (Float)size.height};
  if (_state->getData() != next) {
    _state->updateState(std::move(next));
  }
}

@end

Class<RCTComponentViewProtocol> PCTextFieldCls(void) {
  return PCTextField.class;
}
