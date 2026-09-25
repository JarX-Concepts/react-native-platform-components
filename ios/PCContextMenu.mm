// PCContextMenu.mm

#import "PCContextMenu.h"

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

#import "PCMenuItems.h"

using namespace facebook::react;
using namespace platformcomponents;

@implementation PCContextMenu {
  PCContextMenuView *_view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<PCContextMenuComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    // Fabric views seed _props with their own defaults: RCTViewComponentView
    // asserts on it in debug builds of React Native core, and the first
    // updateProps would otherwise read the base ViewProps as PCContextMenuProps.
    static const auto defaultProps = std::make_shared<const PCContextMenuProps>();
    _props = defaultProps;

    _view = [PCContextMenuView new];
    self.contentView = _view;

    __weak __typeof(self) weakSelf = self;

    _view.onPressAction = ^(NSString *actionId, NSString *actionTitle) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      [strongSelf->_view.haptics performIn:strongSelf->_view];

      auto eventEmitter =
          std::static_pointer_cast<const PCContextMenuEventEmitter>(
              strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      PCContextMenuEventEmitter::OnPressAction payload = {
          .actionId = actionId.UTF8String,
          .actionTitle = actionTitle.UTF8String,
      };

      eventEmitter->onPressAction(payload);
    };

    _view.onMenuOpen = ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCContextMenuEventEmitter>(
              strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onMenuOpen({});
    };

    _view.onMenuClose = ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCContextMenuEventEmitter>(
              strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onMenuClose({});
    };

    _view.onPreviewPress = ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCContextMenuEventEmitter>(
              strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      eventEmitter->onPreviewPress({});
    };
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
  const auto &newProps =
      *std::static_pointer_cast<const PCContextMenuProps>(props);
  const auto prevProps =
      std::static_pointer_cast<const PCContextMenuProps>(oldProps);

  // title
  if (!prevProps || newProps.title != prevProps->title) {
    if (!newProps.title.empty()) {
      _view.menuTitle = [NSString stringWithUTF8String:newProps.title.c_str()];
    } else {
      _view.menuTitle = nil;
    }
  }

  // actions: the flattened menu items
  if (!prevProps || !PCMenuItemsEqual(newProps.actions, prevProps->actions)) {
    _view.actions = PCMenuItemsToArray(newProps.actions);
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

  // trigger: "longPress" | "tap"
  if (!prevProps || newProps.trigger != prevProps->trigger) {
    if (!newProps.trigger.empty()) {
      _view.trigger =
          [NSString stringWithUTF8String:newProps.trigger.c_str()];
    } else {
      _view.trigger = @"longPress";
    }
  }

  if (!prevProps || newProps.haptics != prevProps->haptics) {
    _view.haptics.kind = [NSString stringWithUTF8String:newProps.haptics.c_str()];
  }

  // iOS-specific props
  const auto &newIOS = newProps.ios;
  const auto &oldIOS = prevProps ? prevProps->ios : PCContextMenuIosStruct{};
  if (!prevProps || newIOS.enablePreview != oldIOS.enablePreview) {
    if (!newIOS.enablePreview.empty()) {
      _view.enablePreview =
          [NSString stringWithUTF8String:newIOS.enablePreview.c_str()];
    } else {
      _view.enablePreview = @"false";
    }
  }

  [super updateProps:props oldProps:oldProps];
}

@end

Class<RCTComponentViewProtocol> PCContextMenuCls(void) {
  return PCContextMenu.class;
}
