#pragma once

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

// Only include what we need for the shadow node definition
// Do NOT include ComponentDescriptors.h here to avoid circular dependency
#include <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#include <react/renderer/components/PlatformComponentsViewSpec/Props.h>

#include "PCDatePickerState-custom.h"

namespace facebook::react {

extern const char PCDatePickerComponentName[];

/**
 * Custom ShadowNode for DatePicker that supports Yoga measurement.
 *
 * Key behavior:
 * - Native side measures the actual picker and updates state with frameSize
 * - measureContent() returns the size from state for proper Yoga layout
 * - No hardcoded dimensions - uses actual measured values from native
 */
class MeasuringPCDatePickerShadowNode final
    : public ConcreteViewShadowNode<
          PCDatePickerComponentName,
          PCDatePickerProps,
          PCDatePickerEventEmitter,
          PCDatePickerStateFrameSize> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode);
    return traits;
  }

  /**
   * Called by Yoga when it needs the intrinsic size of the component.
   * Returns the size provided by native through state - no hardcoding.
   */
  Size measureContent(
      const LayoutContext& layoutContext,
      const LayoutConstraints& layoutConstraints) const override;
};

} // namespace facebook::react
