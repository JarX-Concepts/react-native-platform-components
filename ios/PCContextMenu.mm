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

using namespace facebook::react;

namespace {
// Helper to convert subaction struct to NSDictionary
static NSDictionary *SubactionToDict(const PCContextMenuActionsSubactionsStruct &action) {
  NSMutableDictionary *dict = [NSMutableDictionary new];

  dict[@"id"] = action.id.empty() ? @"" : [NSString stringWithUTF8String:action.id.c_str()];
  dict[@"title"] = action.title.empty() ? @"" : [NSString stringWithUTF8String:action.title.c_str()];

  if (!action.subtitle.empty()) {
    dict[@"subtitle"] = [NSString stringWithUTF8String:action.subtitle.c_str()];
  }

  if (!action.image.empty()) {
    dict[@"image"] = [NSString stringWithUTF8String:action.image.c_str()];
  }

  if (!action.imageColor.empty()) {
    dict[@"imageColor"] = [NSString stringWithUTF8String:action.imageColor.c_str()];
  }

  // Check if any attributes field is non-empty
  if (!action.attributes.destructive.empty() ||
      !action.attributes.disabled.empty() ||
      !action.attributes.hidden.empty()) {
    NSMutableDictionary *attrs = [NSMutableDictionary new];
    attrs[@"destructive"] = action.attributes.destructive.empty() ? @"false" :
        [NSString stringWithUTF8String:action.attributes.destructive.c_str()];
    attrs[@"disabled"] = action.attributes.disabled.empty() ? @"false" :
        [NSString stringWithUTF8String:action.attributes.disabled.c_str()];
    attrs[@"hidden"] = action.attributes.hidden.empty() ? @"false" :
        [NSString stringWithUTF8String:action.attributes.hidden.c_str()];
    dict[@"attributes"] = attrs;
  }

  if (!action.state.empty()) {
    dict[@"state"] = [NSString stringWithUTF8String:action.state.c_str()];
  }

  return dict;
}

// Helper to convert action struct to NSDictionary
static NSDictionary *ActionToDict(const PCContextMenuActionsStruct &action) {
  NSMutableDictionary *dict = [NSMutableDictionary new];

  dict[@"id"] = action.id.empty() ? @"" : [NSString stringWithUTF8String:action.id.c_str()];
  dict[@"title"] = action.title.empty() ? @"" : [NSString stringWithUTF8String:action.title.c_str()];

  if (!action.subtitle.empty()) {
    dict[@"subtitle"] = [NSString stringWithUTF8String:action.subtitle.c_str()];
  }

  if (!action.image.empty()) {
    dict[@"image"] = [NSString stringWithUTF8String:action.image.c_str()];
  }

  if (!action.imageColor.empty()) {
    dict[@"imageColor"] = [NSString stringWithUTF8String:action.imageColor.c_str()];
  }

  // Check if any attributes field is non-empty
  if (!action.attributes.destructive.empty() ||
      !action.attributes.disabled.empty() ||
      !action.attributes.hidden.empty()) {
    NSMutableDictionary *attrs = [NSMutableDictionary new];
    attrs[@"destructive"] = action.attributes.destructive.empty() ? @"false" :
        [NSString stringWithUTF8String:action.attributes.destructive.c_str()];
    attrs[@"disabled"] = action.attributes.disabled.empty() ? @"false" :
        [NSString stringWithUTF8String:action.attributes.disabled.c_str()];
    attrs[@"hidden"] = action.attributes.hidden.empty() ? @"false" :
        [NSString stringWithUTF8String:action.attributes.hidden.c_str()];
    dict[@"attributes"] = attrs;
  }

  if (!action.state.empty()) {
    dict[@"state"] = [NSString stringWithUTF8String:action.state.c_str()];
  }

  // Convert subactions (vector, not optional)
  if (!action.subactions.empty()) {
    NSMutableArray *subs = [NSMutableArray new];
    for (const auto &sub : action.subactions) {
      [subs addObject:SubactionToDict(sub)];
    }
    dict[@"subactions"] = subs;
  }

  return dict;
}

static bool ActionsEqual(
    const std::vector<PCContextMenuActionsStruct> &a,
    const std::vector<PCContextMenuActionsStruct> &b) {
  if (a.size() != b.size()) return false;
  for (size_t i = 0; i < a.size(); i++) {
    if (a[i].id != b[i].id) return false;
    if (a[i].title != b[i].title) return false;
    // Simplified comparison - in production, compare all fields
  }
  return true;
}
} // namespace

@implementation PCContextMenu {
  PCContextMenuView *_view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<PCContextMenuComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    _view = [PCContextMenuView new];
    self.contentView = _view;

    __weak __typeof(self) weakSelf = self;

    _view.onPressAction = ^(NSString *actionId, NSString *actionTitle) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

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

  // actions
  if (!prevProps || !ActionsEqual(newProps.actions, prevProps->actions)) {
    NSMutableArray *arr = [NSMutableArray new];
    for (const auto &action : newProps.actions) {
      [arr addObject:ActionToDict(action)];
    }
    _view.actions = arr;
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
