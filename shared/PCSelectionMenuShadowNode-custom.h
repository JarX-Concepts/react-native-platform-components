#pragma once

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

#import <react/renderer/components/PlatformComponentsViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#import <react/renderer/components/PlatformComponentsViewSpec/Props.h>

namespace facebook::react {

extern const char PCSelectionMenuComponentName[];

/**
 * ShadowNode for SelectionMenu.
 *
 * Key behavior:
 * - Provides a non-zero default measured height (minRowHeight) so the view
 *   remains tappable when JS does not specify an explicit height.
 */
class MeasuringPCSelectionMenuShadowNode final : public ConcreteViewShadowNode<
                                          PCSelectionMenuComponentName,
                                          PCSelectionMenuProps,
                                          PCSelectionMenuEventEmitter,
                                          PCSelectionMenuState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  static constexpr float kMinRowHeight = 44.0f;
                                            
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
