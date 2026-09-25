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

static inline bool ToolbarItemsEqual(
    const std::vector<PCTextFieldKeyboardToolbarItemsStruct> &a,
    const std::vector<PCTextFieldKeyboardToolbarItemsStruct> &b) {
  if (a.size() != b.size()) return false;
  for (size_t i = 0; i < a.size(); i++) {
    const auto &x = a[i];
    const auto &y = b[i];
    if (x.kind != y.kind || x.itemId != y.itemId || x.title != y.title ||
        x.systemItem != y.systemItem || x.iconType != y.iconType || x.iconName != y.iconName ||
        x.iconUri != y.iconUri || x.iconScale != y.iconScale || x.iconTinted != y.iconTinted ||
        x.prominent != y.prominent || x.accessibilityLabel != y.accessibilityLabel ||
        x.testID != y.testID) {
      return false;
    }
  }
  return true;
}

static inline bool TextStyleEqual(
    const PCTextFieldTextStyleStruct &a,
    const PCTextFieldTextStyleStruct &b) {
  return a.fontFamily == b.fontFamily && a.fontSize == b.fontSize &&
         a.fontWeight == b.fontWeight && a.fontStyle == b.fontStyle;
}

/// Builds the input font from RN-style font props, or nil when every field is
/// unset so the field keeps the body text style. The font is built at the
/// default text size; the view scales it with Dynamic Type.
static UIFont *FontFromTextStyle(const PCTextFieldTextStyleStruct &style) {
  if (style.fontFamily.empty() && style.fontSize <= 0 &&
      style.fontWeight.empty() && style.fontStyle.empty()) {
    return nil;
  }
  UITraitCollection *defaultSize =
      [UITraitCollection traitCollectionWithPreferredContentSizeCategory:UIContentSizeCategoryLarge];
  return [RCTFont updateFont:[UIFont preferredFontForTextStyle:UIFontTextStyleBody
                                 compatibleWithTraitCollection:defaultSize]
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
    // Fabric views seed _props with their own defaults: RCTViewComponentView
    // asserts on it in debug builds of React Native core, and the first
    // updateProps would otherwise read the base ViewProps as PCTextFieldProps.
    static const auto defaultProps = std::make_shared<const PCTextFieldProps>();
    _props = defaultProps;

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

    _view.onSelectionChange = ^(NSInteger start, NSInteger end) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCTextFieldEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onFieldSelectionChange({.start = (int)start, .end = (int)end});
    };

    _view.onKeyboardToolbarPress = ^(NSString *itemId) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCTextFieldEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onKeyboardToolbarPress({.itemId = itemId.UTF8String});
    };

    _view.onTrailingIconPress = ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCTextFieldEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onTrailingIconPress({});
    };

    _view.onPress = ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCTextFieldEventEmitter>(strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onFieldPress({});
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

  if (!prevProps || newProps.submitBehavior != prevProps->submitBehavior) {
    _view.submitBehavior = NSStringFromStd(newProps.submitBehavior, @"");
  }

  // keyboardToolbarItems: {kind, itemId, title, systemItem, icon fields, prominent, ...}
  if (!prevProps || !ToolbarItemsEqual(newProps.keyboardToolbarItems, prevProps->keyboardToolbarItems)) {
    NSMutableArray *items = [NSMutableArray new];
    for (const auto &item : newProps.keyboardToolbarItems) {
      [items addObject:@{
        @"kind" : NSStringFromStd(item.kind, @"button"),
        @"itemId" : NSStringFromStd(item.itemId, @""),
        @"title" : NSStringFromStd(item.title, @""),
        @"systemItem" : NSStringFromStd(item.systemItem, @""),
        @"iconType" : NSStringFromStd(item.iconType, @""),
        @"iconName" : NSStringFromStd(item.iconName, @""),
        @"iconUri" : NSStringFromStd(item.iconUri, @""),
        @"iconScale" : @(item.iconScale),
        @"iconTinted" : NSStringFromStd(item.iconTinted, @"true"),
        @"prominent" : NSStringFromStd(item.prominent, @"false"),
        @"accessibilityLabel" : NSStringFromStd(item.accessibilityLabel, @""),
        @"testID" : NSStringFromStd(item.testID, @""),
      }];
    }
    _view.keyboardToolbarItems = items;
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

  if (!prevProps || newProps.leadingIconTestID != prevProps->leadingIconTestID) {
    _view.leadingIconTestID = NSStringFromStd(newProps.leadingIconTestID, @"");
  }
  if (!prevProps || newProps.leadingIconSpokenLabel != prevProps->leadingIconSpokenLabel) {
    _view.leadingIconSpokenLabel = NSStringFromStd(newProps.leadingIconSpokenLabel, @"");
  }
  if (!prevProps || newProps.trailingIconTestID != prevProps->trailingIconTestID) {
    _view.trailingIconTestID = NSStringFromStd(newProps.trailingIconTestID, @"");
  }
  if (!prevProps || newProps.trailingIconSpokenLabel != prevProps->trailingIconSpokenLabel) {
    _view.trailingIconSpokenLabel = NSStringFromStd(newProps.trailingIconSpokenLabel, @"");
  }

  // Colors arrive as SharedColor (already processed by React Native)
  if (!prevProps || newProps.activeColor != prevProps->activeColor) {
    _view.activeColor = RCTUIColorFromSharedColor(newProps.activeColor);
  }
  if (!prevProps || newProps.outlineColor != prevProps->outlineColor) {
    _view.outlineColor = RCTUIColorFromSharedColor(newProps.outlineColor);
  }
  if (!prevProps || newProps.errorColor != prevProps->errorColor) {
    _view.errorColor = RCTUIColorFromSharedColor(newProps.errorColor);
  }
  if (!prevProps || newProps.containerColor != prevProps->containerColor) {
    _view.containerColor = RCTUIColorFromSharedColor(newProps.containerColor);
  }
  if (!prevProps || newProps.textColor != prevProps->textColor) {
    _view.textColor = RCTUIColorFromSharedColor(newProps.textColor);
  }
  if (!prevProps || newProps.placeholderTextColor != prevProps->placeholderTextColor) {
    _view.placeholderTextColor = RCTUIColorFromSharedColor(newProps.placeholderTextColor);
  }

  if (!prevProps || newProps.maxFontSizeMultiplier != prevProps->maxFontSizeMultiplier) {
    _view.maxFontSizeMultiplier = newProps.maxFontSizeMultiplier;
  }
  if (!prevProps || newProps.textAlign != prevProps->textAlign) {
    _view.textAlign = NSStringFromStd(newProps.textAlign, @"");
  }
  if (!prevProps || newProps.minLines != prevProps->minLines) {
    _view.minLines = newProps.minLines;
  }
  if (!prevProps || newProps.maxLines != prevProps->maxLines) {
    _view.maxLines = newProps.maxLines;
  }
  if (!prevProps || newProps.pressMode != prevProps->pressMode) {
    _view.pressable = newProps.pressMode == "button";
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
  if (!prevProps || newIOS.passwordRules != oldIOS.passwordRules) {
    _view.passwordRules = NSStringFromStd(newIOS.passwordRules, @"");
  }

  // autoFocus last, once the field is configured
  if (!prevProps || newProps.autoFocus != prevProps->autoFocus) {
    _view.autoFocus = newProps.autoFocus == "focus";
  }

  // android: Android only

  const bool testIdChanged = !prevProps || newProps.testId != prevProps->testId;

  [super updateProps:props oldProps:oldProps];

  // testID belongs on the inner input: Detox types into and clears a
  // UITextField / UITextView, and two views with one id would be ambiguous
  if (testIdChanged) {
    _view.inputTestID = NSStringFromStd(newProps.testId, @"");
    self.accessibilityIdentifier = nil;
  }

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

- (void)setSelection:(NSInteger)eventCount start:(NSInteger)start end:(NSInteger)end {
  [_view setSelectionWithStart:start end:end eventCount:eventCount];
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
