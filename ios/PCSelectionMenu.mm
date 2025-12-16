// SelectionMenu.mm

#import "PCSelectionMenu.h"

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

#import "PCSelectionMenuComponentDescriptors-custom.h"

using namespace facebook::react;

@implementation PCSelectionMenu {
  PCSelectionMenuView *_view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<
    MeasuringPCDatePickerComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    _view = [PCSelectionMenuView new];
    self.contentView = _view;

    __weak __typeof(self) weakSelf = self;

    _view.onSelect = ^(NSInteger index, NSString *value) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf)
        return;

      auto eventEmitter =
          std::static_pointer_cast<const PCSelectionMenuEventEmitter>(
              strongSelf->_eventEmitter);
      if (!eventEmitter)
        return;

      PCSelectionMenuEventEmitter::OnSelect payload = {
          .index = (int)index,
          .value = value.UTF8String,
      };
      eventEmitter->onSelect(payload);
    };

    _view.onRequestClose = ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf)
        return;

      auto eventEmitter =
          std::static_pointer_cast<const PCSelectionMenuEventEmitter>(
              strongSelf->_eventEmitter);
      if (!eventEmitter)
        return;

      eventEmitter->onRequestClose({});
    };
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
  const auto &newProps =
      *std::static_pointer_cast<const PCSelectionMenuProps>(props);
  const auto prevProps =
      std::static_pointer_cast<const PCSelectionMenuProps>(oldProps);

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

  // inlineMode (top-level, default false)
  if (!prevProps || newProps.inlineMode != prevProps->inlineMode) {
    _view.inlineMode = (BOOL)newProps.inlineMode;
  }

  // presentation (top-level, default "auto")
  if (!prevProps || newProps.presentation != prevProps->presentation) {
    if (!newProps.presentation.empty()) {
      _view.presentation =
          [NSString stringWithUTF8String:newProps.presentation.c_str()];
    } else {
      _view.presentation = @"auto";
    }
  }

  // visible (top-level, default "closed")
  if (!prevProps || newProps.visible != prevProps->visible) {
    if (!newProps.visible.empty()) {
      _view.visible = [NSString stringWithUTF8String:newProps.visible.c_str()];
    } else {
      _view.visible = @"closed";
    }
  }

  [super updateProps:props oldProps:oldProps];
}

@end
