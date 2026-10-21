// PCActionSheet.mm

#import "PCActionSheet.h"

#import <React/RCTComponentViewFactory.h>
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>

#import <react/renderer/components/PlatformComponentsViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#import <react/renderer/components/PlatformComponentsViewSpec/Props.h>

#if __has_include(<PlatformComponents/PlatformComponents-Swift.h>)
#import <PlatformComponents/PlatformComponents-Swift.h>
#else
#import "PlatformComponents-Swift.h"
#endif

using namespace facebook::react;

namespace {
static inline NSString *ToNSString(const std::string &value) {
  return value.empty() ? @"" : [NSString stringWithUTF8String:value.c_str()];
}

static inline bool ActionsEqual(
    const std::vector<PCActionSheetActionsStruct> &a,
    const std::vector<PCActionSheetActionsStruct> &b) {
  if (a.size() != b.size()) return false;
  for (size_t i = 0; i < a.size(); i++) {
    const auto &x = a[i];
    const auto &y = b[i];
    if (x.id != y.id || x.title != y.title || x.iconType != y.iconType ||
        x.iconName != y.iconName || x.iconRequest != y.iconRequest || x.iconUri != y.iconUri ||
        x.iconScale != y.iconScale || x.iconTinted != y.iconTinted ||
        x.imageColor != y.imageColor || x.destructive != y.destructive ||
        x.disabled != y.disabled || x.haptics != y.haptics || x.testID != y.testID) {
      return false;
    }
  }
  return true;
}
} // namespace

@implementation PCActionSheet {
  PCActionSheetView *_view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<PCActionSheetComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    // Fabric views seed _props with their own defaults: RCTViewComponentView
    // asserts on it in debug builds of React Native core, and the first
    // updateProps would otherwise read the base ViewProps as PCActionSheetProps.
    static const auto defaultProps = std::make_shared<const PCActionSheetProps>();
    _props = defaultProps;

    // Covers the component's frame without taking touches; the children
    // mount next to it, and the sheet's popover points at them.
    _view = [PCActionSheetView new];
    self.contentView = _view;

    __weak __typeof(self) weakSelf = self;

    _view.onSelect = ^(NSString *actionId) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCActionSheetEventEmitter>(
              strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      PCActionSheetEventEmitter::OnSelect payload = {
          .actionId = actionId.UTF8String,
      };

      eventEmitter->onSelect(payload);
    };

    _view.onCancel = ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCActionSheetEventEmitter>(
              strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onCancel({});
    };
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
  const auto &newProps =
      *std::static_pointer_cast<const PCActionSheetProps>(props);
  const auto prevProps =
      std::static_pointer_cast<const PCActionSheetProps>(oldProps);

  if (!prevProps || newProps.title != prevProps->title) {
    _view.sheetTitle = ToNSString(newProps.title);
  }

  if (!prevProps || newProps.message != prevProps->message) {
    _view.message = ToNSString(newProps.message);
  }

  // actions: [{id, title, icon fields, imageColor, destructive, disabled, haptics, testID}]
  if (!prevProps || !ActionsEqual(newProps.actions, prevProps->actions)) {
    NSMutableArray *arr = [NSMutableArray arrayWithCapacity:newProps.actions.size()];
    for (const auto &action : newProps.actions) {
      // iOS draws no icons; the sheet on screen only compares them, so a
      // changed icon waits for the next presentation, as on Android.
      NSString *icon = [NSString stringWithFormat:@"%@\n%@\n%@\n%@\n%g\n%@\n%@",
                                                  ToNSString(action.iconType),
                                                  ToNSString(action.iconName),
                                                  ToNSString(action.iconRequest),
                                                  ToNSString(action.iconUri),
                                                  action.iconScale,
                                                  ToNSString(action.iconTinted),
                                                  ToNSString(action.imageColor)];
      [arr addObject:@{
        @"id" : ToNSString(action.id),
        @"title" : ToNSString(action.title),
        @"icon" : icon,
        @"destructive" : ToNSString(action.destructive),
        @"disabled" : ToNSString(action.disabled),
        @"haptics" : ToNSString(action.haptics),
        @"testID" : ToNSString(action.testID),
      }];
    }
    _view.actions = arr;
  }

  if (!prevProps || newProps.cancelTitle != prevProps->cancelTitle) {
    _view.cancelTitle = ToNSString(newProps.cancelTitle);
  }

  if (!prevProps || newProps.cancelTestID != prevProps->cancelTestID) {
    _view.cancelTestID = ToNSString(newProps.cancelTestID);
  }

  if (!prevProps || newProps.haptics != prevProps->haptics) {
    _view.haptics.kind = ToNSString(newProps.haptics);
  }

  // visible last, so a sheet opened by this update has the new actions.
  // "open" | "closed"
  if (!prevProps || newProps.visible != prevProps->visible) {
    _view.visible = newProps.visible.empty() ? @"closed" : ToNSString(newProps.visible);
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)prepareForRecycle {
  [super prepareForRecycle];
  [_view resetForRecycle];
}

@end

Class<RCTComponentViewProtocol> PCActionSheetCls(void) {
  return PCActionSheet.class;
}
