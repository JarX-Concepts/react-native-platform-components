#pragma once

#include "PCSelectionMenuShadowNode-custom.h"

#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/mounting/ShadowView.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/ShadowNodeTraits.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/core/ShadowNodeFamily.h>
#include <react/renderer/components/view/YogaLayoutableShadowNode.h>

namespace facebook::react
{
using MeasuringPCSelectionMenuComponentDescriptor = ConcreteComponentDescriptor<MeasuringPCSelectionMenuShadowNode>;

/*
    class MeasuringPCDatePickerComponentDescriptor final
        : public ConcreteComponentDescriptor<MeasuringPCSelectionMenuShadowNode>
    {
    public:
        using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
    };*/

} // namespace facebook::react
