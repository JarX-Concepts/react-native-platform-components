#pragma once

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

// Only include what we need for the shadow node definition
// Do NOT include ComponentDescriptors.h here to avoid circular dependency
#include <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#include <react/renderer/components/PlatformComponentsViewSpec/Props.h>

#include "PCTextFieldState-custom.h"

namespace facebook::react {

extern const char PCTextFieldComponentName[];

/**
 * Custom ShadowNode for TextField that supports Yoga measurement.
 *
 * - The field takes the width Yoga offers (a text field fills its row)
 * - Native measures the height at that width and updates state with it
 * - Falls back to platform-specific heights until native has reported
 */
class MeasuringPCTextFieldShadowNode final : public ConcreteViewShadowNode<
                                          PCTextFieldComponentName,
                                          PCTextFieldProps,
                                          PCTextFieldEventEmitter,
                                          PCTextFieldStateFrameSize> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  // Fallback heights used when native hasn't reported measurements yet
  // iOS: a rounded-rect UITextField
  static constexpr float kFallbackHeightIOS = 34.0f;

  // Android: a Material 3 outlined text field
  static constexpr float kFallbackHeightAndroid = 56.0f;

  static constexpr float kFallbackWidth = 200.0f;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode);
    return traits;
  }

  /**
   * Called by Yoga when it needs the intrinsic size of the component.
   */
  Size measureContent(
      const LayoutContext& layoutContext,
      const LayoutConstraints& layoutConstraints) const override;
};

} // namespace facebook::react
