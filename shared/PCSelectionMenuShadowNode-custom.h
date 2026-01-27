#pragma once

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

// Only include what we need for the shadow node definition
// Do NOT include ComponentDescriptors.h here to avoid circular dependency
#include <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#include <react/renderer/components/PlatformComponentsViewSpec/Props.h>
#include <react/renderer/components/PlatformComponentsViewSpec/States.h>

namespace facebook::react {

extern const char PCSelectionMenuComponentName[];

/**
 * ShadowNode for SelectionMenu.
 *
 * Key behavior:
 * - Provides a non-zero default measured height (minRowHeight) so the view
 *   remains tappable when JS does not specify an explicit height.
 * - Uses platform-specific heights: iOS uses 44pt, Android uses 56dp for
 *   system Spinner or 72dp for M3 TextInputLayout.
 */
class MeasuringPCSelectionMenuShadowNode final : public ConcreteViewShadowNode<
                                          PCSelectionMenuComponentName,
                                          PCSelectionMenuProps,
                                          PCSelectionMenuEventEmitter,
                                          PCSelectionMenuState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  // iOS standard row height
  static constexpr float kMinRowHeight = 44.0f;

  // Android System Spinner height
  static constexpr float kMinRowHeightAndroid = 56.0f;

  // Android M3 TextInputLayout with floating label height
  static constexpr float kMinRowHeightAndroidM3 = 72.0f;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode);
    return traits;
  }

  /**
   * Called by Yoga when it needs the intrinsic size of the component.
   * We ensure a sensible minimum height so the view doesn't measure to 0.
   */
  Size measureContent(
      const LayoutContext& layoutContext,
      const LayoutConstraints& layoutConstraints) const override;
};

} // namespace facebook::react
