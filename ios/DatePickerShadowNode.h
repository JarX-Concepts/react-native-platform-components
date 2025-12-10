#pragma once

#include <react/renderer/components/PlatformComponentsViewSpec/ComponentDescriptors.h>
// This header defines:
//   - using DatePickerShadowNode = ConcreteViewShadowNode<...>;
//   - DatePickerProps
//   - DatePickerEventEmitter
//   - DatePickerComponentName
//
// It also pulls in ConcreteComponentDescriptor, Size, LayoutContext, etc.

namespace facebook::react
{

    class MeasuringDatePickerShadowNode final : public DatePickerShadowNode
    {
    public:
        using DatePickerShadowNode::DatePickerShadowNode;

        static ShadowNodeTraits BaseTraits();

        Size measureContent(
            const LayoutContext &layoutContext,
            const LayoutConstraints &layoutConstraints) const override;
    };

    using MeasuringDatePickerComponentDescriptor =
        ConcreteComponentDescriptor<MeasuringDatePickerShadowNode>;

} // namespace facebook::react
