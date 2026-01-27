#pragma once

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

// Only include what we need for the shadow node definition
// Do NOT include ComponentDescriptors.h here to avoid circular dependency
#include <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#include <react/renderer/components/PlatformComponentsViewSpec/Props.h>

#include "PCSelectionMenuState-custom.h"

namespace facebook::react {

extern const char PCSelectionMenuComponentName[];

/**
 * Custom ShadowNode for SelectionMenu that supports Yoga measurement.
 *
 * Key behavior:
 * - Native side measures the actual picker and updates state with frameSize
 * - measureContent() returns the size from state for proper Yoga layout
 * - Falls back to platform-specific defaults if state hasn't been set yet
 */
class MeasuringPCSelectionMenuShadowNode final : public ConcreteViewShadowNode<
                                          PCSelectionMenuComponentName,
                                          PCSelectionMenuProps,
                                          PCSelectionMenuEventEmitter,
                                          PCSelectionMenuStateFrameSize> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  // Fallback heights used when native hasn't reported measurements yet
  // iOS standard row height
  static constexpr float kFallbackHeightIOS = 44.0f;

  // Android System Spinner height
  static constexpr float kFallbackHeightAndroid = 56.0f;

  // Android M3 TextInputLayout with floating label height
  static constexpr float kFallbackHeightAndroidM3 = 72.0f;

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
