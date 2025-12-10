#include "DatePickerShadowNode.h"

#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/ShadowNodeTraits.h>
#include <cmath>
#include <cstdio>

namespace facebook::react
{
    ShadowNodeTraits MeasuringDatePickerShadowNode::BaseTraits()
    {
        // Start with whatever traits the generated DatePickerShadowNode already has.
        auto traits = DatePickerShadowNode::BaseTraits();

        // Mark this node as measurable so Yoga will call measureContent.
        traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
        traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode);

        return traits;
    }

    Size MeasuringDatePickerShadowNode::measureContent(
        const LayoutContext & /*layoutContext*/,
        const LayoutConstraints &layoutConstraints) const
    {
        return {400.0f, 400.0f};
    }

} // namespace facebook::react
