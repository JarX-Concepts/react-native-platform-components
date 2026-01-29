#pragma once

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

// Only include what we need for the shadow node definition
// Do NOT include ComponentDescriptors.h here to avoid circular dependency
#include <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#include <react/renderer/components/PlatformComponentsViewSpec/Props.h>

#include "PCSegmentedControlState-custom.h"

namespace facebook::react {

extern const char PCSegmentedControlComponentName[];

/**
 * Custom ShadowNode for SegmentedControl that supports Yoga measurement.
 *
 * Key behavior:
 * - Native side measures the actual segmented control and updates state with frameSize
 * - measureContent() returns the size from state for proper Yoga layout
 * - Falls back to platform-specific defaults if state hasn't been set yet
 */
class MeasuringPCSegmentedControlShadowNode final : public ConcreteViewShadowNode<
                                          PCSegmentedControlComponentName,
                                          PCSegmentedControlProps,
                                          PCSegmentedControlEventEmitter,
                                          PCSegmentedControlStateFrameSize> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  // Fallback heights used when native hasn't reported measurements yet
  // iOS UISegmentedControl default height
  static constexpr float kFallbackHeightIOS = 32.0f;

  // Android MaterialButtonToggleGroup height
  static constexpr float kFallbackHeightAndroid = 48.0f;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode);
    return traits;
  }

  /**
   * Called by Yoga when it needs the intrinsic size of the component.
   * Returns the size provided by native through state, with fallback to
   * platform-specific defaults if state hasn't been set.
   */
  Size measureContent(
      const LayoutContext& layoutContext,
      const LayoutConstraints& layoutConstraints) const override;
};

} // namespace facebook::react
