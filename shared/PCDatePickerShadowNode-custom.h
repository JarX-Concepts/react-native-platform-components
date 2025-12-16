#pragma once

#include <react/renderer/components/PlatformComponentsViewSpec/ComponentDescriptors.h>
#include <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#include <react/renderer/components/PlatformComponentsViewSpec/Props.h>

#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/ConcreteState.h>
#include <react/renderer/core/ShadowNodeTraits.h>
#include <react/renderer/mounting/ShadowView.h>

#include "PCDatePickerState-custom.h"

namespace facebook::react
{
    class MeasuringPCDatePickerShadowNode final
        : public ConcreteViewShadowNode<
              PCDatePickerComponentName,
              PCDatePickerProps,
              PCDatePickerEventEmitter,
              PCDatePickerStateFrameSize>
    {
    public:
        using ConcreteViewShadowNode::ConcreteViewShadowNode;
    };

} // namespace facebook::react
