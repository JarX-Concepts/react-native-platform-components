// PCSelectionMenu.mm

#import "PCSelectionMenu.h"

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

#import "PCSelectionMenuComponentDescriptors-custom.h"
#import "PCSelectionMenuShadowNode-custom.h"
#import "PCSelectionMenuState-custom.h"

using namespace facebook::react;

namespace {
static inline bool OptionsEqual(
    const std::vector<facebook::react::PCSelectionMenuOptionsStruct> &a,
    const std::vector<facebook::react::PCSelectionMenuOptionsStruct> &b) {
  if (a.size() != b.size()) return false;
  for (size_t i = 0; i < a.size(); i++) {
    if (a[i].label != b[i].label) return false;
    if (a[i].data != b[i].data) return false;
  }
  return true;
}
} // namespace

@interface PCSelectionMenu ()

- (void)updateMeasurements;

@end

@implementation PCSelectionMenu {
  PCSelectionMenuView *_view;
  MeasuringPCSelectionMenuShadowNode::ConcreteState::Shared _state;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<
      MeasuringPCSelectionMenuComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    _view = [PCSelectionMenuView new];
    self.contentView = _view;

    __weak __typeof(self) weakSelf = self;

    _view.onSelect = ^(NSInteger index, NSString *label, NSString *data) {
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCSelectionMenuEventEmitter>(
              strongSelf->_eventEmitter);
      if (!eventEmitter) return;

      PCSelectionMenuEventEmitter::OnSelect payload = {
          .index = (int)index,
          .label = label.UTF8String,
          .data = data.UTF8String,
      };

      eventEmitter->onSelect(payload);
    };

    _view.onRequestClose = ^{
      __typeof(self) strongSelf = weakSelf;
      if (!strongSelf) return;

      auto eventEmitter =
          std::static_pointer_cast<const PCSelectionMenuEventEmitter>(
              strongSelf->_eventEmitter);
      if (!eventEmitter) return;

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

  // options: [{label,data}]
  if (!prevProps || !OptionsEqual(newProps.options, prevProps->options)) {
    NSMutableArray *arr = [NSMutableArray new];
    for (const auto &opt : newProps.options) {
      NSString *label = opt.label.empty()
                            ? @""
                            : [NSString stringWithUTF8String:opt.label.c_str()];
      NSString *data = opt.data.empty()
                           ? @""
                           : [NSString stringWithUTF8String:opt.data.c_str()];
      [arr addObject:@{@"label" : label, @"data" : data}];
    }
    _view.options = arr;
  }

  // selectedData (default "")
  if (!prevProps || newProps.selectedData != prevProps->selectedData) {
    if (!newProps.selectedData.empty()) {
      _view.selectedData =
          [NSString stringWithUTF8String:newProps.selectedData.c_str()];
    } else {
      _view.selectedData = @""; // sentinel
    }
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

  // placeholder
  if (!prevProps || newProps.placeholder != prevProps->placeholder) {
    if (!newProps.placeholder.empty()) {
      _view.placeholder =
          [NSString stringWithUTF8String:newProps.placeholder.c_str()];
    } else {
      _view.placeholder = nil;
    }
  }

  // anchorMode: "inline" | "headless"
  if (!prevProps || newProps.anchorMode != prevProps->anchorMode) {
    if (!newProps.anchorMode.empty()) {
      _view.anchorMode =
          [NSString stringWithUTF8String:newProps.anchorMode.c_str()];
    } else {
      _view.anchorMode = @"headless";
    }
  }

  // visible: "open" | "closed"
  if (!prevProps || newProps.visible != prevProps->visible) {
    if (!newProps.visible.empty()) {
      _view.visible = [NSString stringWithUTF8String:newProps.visible.c_str()];
    } else {
      _view.visible = @"closed";
    }
  }

  // android.material (plumbed through; iOS can ignore)
  const auto &newAndroid = newProps.android;
  const auto &oldAndroid =
      prevProps ? prevProps->android : PCSelectionMenuAndroidStruct{};
  if (!prevProps || newAndroid.material != oldAndroid.material) {
    if (!newAndroid.material.empty()) {
      _view.androidMaterial =
          [NSString stringWithUTF8String:newAndroid.material.c_str()];
    } else {
      _view.androidMaterial = nil;
    }
  }

  [super updateProps:props oldProps:oldProps];

  // Update measurements when props change that affect layout
  [self updateMeasurements];
}

#pragma mark - State (Measuring)

- (void)updateState:(const State::Shared &)state
           oldState:(const State::Shared &)oldState {
  _state = std::static_pointer_cast<
      const MeasuringPCSelectionMenuShadowNode::ConcreteState>(state);

  if (oldState == nullptr) {
    // First time: compute initial size.
    [self updateMeasurements];
  }

  [super updateState:state oldState:oldState];
}

- (void)updateMeasurements {
  if (_state == nullptr)
    return;

  // Use the real width Yoga gave us
  const CGFloat w = self.bounds.size.width > 1 ? self.bounds.size.width : 320;

  CGSize size = [_view sizeForLayoutWithConstrainedTo:CGSizeMake(w, 0)];

  PCSelectionMenuStateFrameSize next;
  next.frameSize = {(Float)size.width, (Float)size.height};
  _state->updateState(std::move(next));
}

@end
