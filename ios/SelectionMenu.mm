// SelectionMenu.mm

#import "SelectionMenu.h"

#import <React/RCTComponentViewFactory.h>
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>

#import <react/renderer/components/PlatformComponentsViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#import <react/renderer/components/PlatformComponentsViewSpec/Props.h>

#import "PlatformComponents-Swift.h"

using namespace facebook::react;

@implementation SelectionMenu {
  SelectionMenuView *_view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<
      SelectionMenuComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    _view = [SelectionMenuView new];
    self.contentView = _view;

    __weak __typeof(self) weakSelf = self;

    _view.onSelect = ^(NSInteger index, NSString *value) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) {
        return;
      }

      auto eventEmitter =
          std::static_pointer_cast<const SelectionMenuEventEmitter>(
              strongSelf->_eventEmitter);
      if (!eventEmitter) {
        return;
      }

      SelectionMenuEventEmitter::OnSelect payload = {
          .index = (int)index,
          .value = value.UTF8String,
      };

      eventEmitter->onSelect(payload);
    };

    _view.onRequestClose = ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) {
        return;
      }

      auto eventEmitter =
          std::static_pointer_cast<const SelectionMenuEventEmitter>(
              strongSelf->_eventEmitter);
      if (!eventEmitter) {
        return;
      }

      eventEmitter->onRequestClose({});
    };
  }

  return self;
}

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
  const auto &newProps =
      *std::static_pointer_cast<const SelectionMenuProps>(props);
  const auto prevProps =
      std::static_pointer_cast<const SelectionMenuProps>(oldProps);

  // options
  if (!prevProps || newProps.options != prevProps->options) {
    NSMutableArray<NSString *> *arr = [NSMutableArray new];
    for (const auto &opt : newProps.options) {
      [arr addObject:[NSString stringWithUTF8String:opt.c_str()]];
    }
    _view.options = arr;
  }

  // selectedIndex
  if (!prevProps || newProps.selectedIndex != prevProps->selectedIndex) {
    _view.selectedIndex = (NSInteger)newProps.selectedIndex;
  }

  // disabled
  if (!prevProps || newProps.disabled != prevProps->disabled) {
    _view.disabled = (BOOL)newProps.disabled;
  }

  // placeholder
  if (!prevProps || newProps.placeholder != prevProps->placeholder) {
    if (!newProps.placeholder.empty()) {
      _view.placeholder =
          [NSString stringWithUTF8String:newProps.placeholder.c_str()];
    } else {
      _view.placeholder = nil;
    }
  }

  // visible
  if (!prevProps || newProps.visible != prevProps->visible) {
    if (!newProps.visible.empty()) {
      _view.visible = [NSString stringWithUTF8String:newProps.visible.c_str()];
    } else {
      _view.visible = @"closed";
    }
  }

  // ios.presentation
  if (!prevProps || newProps.ios.presentation != prevProps->ios.presentation) {
    if (!newProps.ios.presentation.empty()) {
      _view.presentation =
          [NSString stringWithUTF8String:newProps.ios.presentation.c_str()];
    } else {
      _view.presentation = @"auto";
    }
  }
  
  // ios.inlineMode
  //if (!prevProps || newProps.ios.inlineMode != prevProps->ios.inlineMode) {
    _view.inlineMode = false;
  //}

  [super updateProps:props oldProps:oldProps];
}
@end
