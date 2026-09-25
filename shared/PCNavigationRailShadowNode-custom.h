#pragma once

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

// Only include what we need for the shadow node definition
// Do NOT include ComponentDescriptors.h here to avoid circular dependency
#include <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#include <react/renderer/components/PlatformComponentsViewSpec/Props.h>

#include "PCNavigationRailState-custom.h"

namespace facebook::react {

extern const char PCNavigationRailComponentName[];

/**
 * Custom ShadowNode for NavigationRail.
 *
 * The rail hosts React children (its header), so it can't be a measured leaf
 * node like the other components. Native measures the rail and reports its
 * natural width through state instead, and the component descriptor turns
 * that width into horizontal padding (see
 * PCNavigationRailComponentDescriptors-custom.h). The header is absolutely
 * positioned, so the padding alone gives the node its width; the height is
 * left to the app's layout.
 */
class MeasuringPCNavigationRailShadowNode final
    : public ConcreteViewShadowNode<
          PCNavigationRailComponentName,
          PCNavigationRailProps,
          PCNavigationRailEventEmitter,
          PCNavigationRailStateFrameSize> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  // Width used until native reports one: the Material 3 Expressive collapsed
  // rail, and the iOS fallback's column of buttons
  static constexpr float kFallbackWidthIOS = 80.0f;
  static constexpr float kFallbackWidthAndroid = 96.0f;
};

} // namespace facebook::react
