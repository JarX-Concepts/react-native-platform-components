#pragma once

#include <react/renderer/components/PlatformComponentsViewSpec/ComponentDescriptors.h>
#include <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#include <react/renderer/components/PlatformComponentsViewSpec/Props.h>

#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/ConcreteState.h>
#include <react/renderer/core/ShadowNodeTraits.h>
#include <react/renderer/mounting/ShadowView.h>

#include "DatePickerState.h"

namespace facebook::react
{
    class MeasuringDatePickerShadowNode final
        : public ConcreteViewShadowNode<
              DatePickerComponentName,
              DatePickerProps,
              DatePickerEventEmitter,
              DatePickerStateFrameSize>
    {
    public:
        using ConcreteViewShadowNode::ConcreteViewShadowNode;
    };

} // namespace facebook::react
