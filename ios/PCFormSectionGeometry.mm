// PCFormSectionGeometry.mm

#import "PCFormSectionGeometry.h"

#import <React/RCTFabricComponentsPlugins.h>

#import <react/renderer/components/PlatformComponentsViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#import <react/renderer/components/PlatformComponentsViewSpec/Props.h>

using namespace facebook::react;

/// An empty view over a FormSection's card. It tells JavaScript where the
/// card is in its window and what the window's safe area is, which decide
/// the row inset of UIKit's inset grouped lists (see FormSection.tsx).
@implementation PCFormSectionGeometry {
  BOOL _reportScheduled;
  BOOL _reported;
  PCFormSectionGeometryEventEmitter::OnGeometryChange _last;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<PCFormSectionGeometryComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    // Fabric views seed _props with their own defaults: RCTViewComponentView
    // asserts on it in debug builds of React Native core, and the first
    // updateProps would otherwise read the base ViewProps as these props.
    static const auto defaultProps = std::make_shared<const PCFormSectionGeometryProps>();
    _props = defaultProps;
    self.userInteractionEnabled = NO;
    self.isAccessibilityElement = NO;
  }
  return self;
}

- (void)updateEventEmitter:(const EventEmitter::Shared &)eventEmitter {
  [super updateEventEmitter:eventEmitter];
  [self scheduleReport];
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
  [self scheduleReport];
}

- (void)layoutSubviews {
  [super layoutSubviews];
  [self scheduleReport];
}

- (void)didMoveToWindow {
  [super didMoveToWindow];
  [self scheduleReport];
}

- (void)safeAreaInsetsDidChange {
  [super safeAreaInsetsDidChange];
  [self scheduleReport];
}

- (void)prepareForRecycle {
  [super prepareForRecycle];
  _reported = NO;
}

// After the current layout pass, when the window's geometry is settled; one
// report for several triggers
- (void)scheduleReport {
  if (_reportScheduled) return;
  _reportScheduled = YES;
  __weak __typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    __typeof(self) strongSelf = weakSelf;
    if (!strongSelf) return;
    strongSelf->_reportScheduled = NO;
    [strongSelf report];
  });
}

- (void)report {
  UIWindow *window = self.window;
  auto eventEmitter =
      std::static_pointer_cast<const PCFormSectionGeometryEventEmitter>(_eventEmitter);
  if (!window || !eventEmitter) return;

  CGRect frame = [self convertRect:self.bounds toView:window];
  UIEdgeInsets safeArea = window.safeAreaInsets;
  PCFormSectionGeometryEventEmitter::OnGeometryChange geometry = {
      .width = (float)CGRectGetWidth(frame),
      .windowLeft = (float)CGRectGetMinX(frame),
      .windowRight = (float)(CGRectGetWidth(window.bounds) - CGRectGetMaxX(frame)),
      .safeAreaLeft = (float)safeArea.left,
      .safeAreaRight = (float)safeArea.right,
  };
  if (_reported && geometry.width == _last.width &&
      geometry.windowLeft == _last.windowLeft &&
      geometry.windowRight == _last.windowRight &&
      geometry.safeAreaLeft == _last.safeAreaLeft &&
      geometry.safeAreaRight == _last.safeAreaRight) {
    return;
  }
  _last = geometry;
  _reported = YES;
  eventEmitter->onGeometryChange(geometry);
}

@end

Class<RCTComponentViewProtocol> PCFormSectionGeometryCls(void) {
  return PCFormSectionGeometry.class;
}
