// PCDialog.mm

#import "PCDialog.h"

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
    const std::vector<PCDialogActionsStruct> &a,
    const std::vector<PCDialogActionsStruct> &b) {
  if (a.size() != b.size()) return false;
  for (size_t i = 0; i < a.size(); i++) {
    const auto &x = a[i];
    const auto &y = b[i];
    if (x.id != y.id || x.title != y.title || x.role != y.role ||
        x.preferred != y.preferred || x.disabled != y.disabled ||
        x.haptics != y.haptics || x.testID != y.testID) {
      return false;
    }
  }
  return true;
}
} // namespace

@implementation PCDialog {
  PCDialogView *_view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<PCDialogComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    // Fabric views seed _props with their own defaults: RCTViewComponentView
    // asserts on it in debug builds of React Native core, and the first
    // updateProps would otherwise read the base ViewProps as PCDialogProps.
    static const auto defaultProps = std::make_shared<const PCDialogProps>();
    _props = defaultProps;

    // An empty view; the alert is presented from the nearest view controller.
    _view = [PCDialogView new];
    self.contentView = _view;

    __weak __typeof(self) weakSelf = self;

    _view.onSelect = ^(NSString *actionId) {
      auto eventEmitter = [weakSelf dialogEventEmitter];
      if (!eventEmitter) return;
      eventEmitter->onSelect({.actionId = actionId.UTF8String});
    };

    _view.onCancel = ^{
      auto eventEmitter = [weakSelf dialogEventEmitter];
      if (!eventEmitter) return;
      eventEmitter->onCancel({});
    };

    _view.onShow = ^{
      auto eventEmitter = [weakSelf dialogEventEmitter];
      if (!eventEmitter) return;
      eventEmitter->onShow({});
    };

    _view.onDismiss = ^{
      auto eventEmitter = [weakSelf dialogEventEmitter];
      if (!eventEmitter) return;
      eventEmitter->onDismiss({});
    };

    _view.onPresentFailed = ^(NSString *reason) {
      auto eventEmitter = [weakSelf dialogEventEmitter];
      if (!eventEmitter) return;
      eventEmitter->onPresentFailed({.reason = reason.UTF8String});
    };
  }
  return self;
}

- (std::shared_ptr<const PCDialogEventEmitter>)dialogEventEmitter {
  return std::static_pointer_cast<const PCDialogEventEmitter>(_eventEmitter);
}

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
  const auto &newProps =
      *std::static_pointer_cast<const PCDialogProps>(props);
  const auto prevProps =
      std::static_pointer_cast<const PCDialogProps>(oldProps);

  if (!prevProps || newProps.title != prevProps->title) {
    _view.dialogTitle = ToNSString(newProps.title);
  }

  if (!prevProps || newProps.message != prevProps->message) {
    _view.message = ToNSString(newProps.message);
  }

  // actions: [{id, title, role, preferred, disabled, haptics, testID}]
  if (!prevProps || !ActionsEqual(newProps.actions, prevProps->actions)) {
    NSMutableArray *arr = [NSMutableArray arrayWithCapacity:newProps.actions.size()];
    for (const auto &action : newProps.actions) {
      [arr addObject:@{
        @"id" : ToNSString(action.id),
        @"title" : ToNSString(action.title),
        @"role" : ToNSString(action.role),
        @"preferred" : ToNSString(action.preferred),
        @"disabled" : ToNSString(action.disabled),
        @"haptics" : ToNSString(action.haptics),
        @"testID" : ToNSString(action.testID),
      }];
    }
    _view.actions = arr;
  }

  if (!prevProps || newProps.haptics != prevProps->haptics) {
    _view.haptics.kind = ToNSString(newProps.haptics);
  }

  // visible last, so a dialog opened by this update has the new actions.
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

Class<RCTComponentViewProtocol> PCDialogCls(void) {
  return PCDialog.class;
}
