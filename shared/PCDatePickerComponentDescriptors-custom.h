#pragma once

#include "PCDatePickerShadowNode-custom.h"

#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/mounting/ShadowView.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/ShadowNodeTraits.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/core/ShadowNodeFamily.h>
#include <react/renderer/components/view/YogaLayoutableShadowNode.h>

namespace facebook::react
{

    class MeasuringPCDatePickerComponentDescriptor final
        : public ConcreteComponentDescriptor<MeasuringPCDatePickerShadowNode>
    {
    public:
        using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

        void adopt(ShadowNode &shadowNode) const override
        {
            auto &pickerShadowNode =
                static_cast<MeasuringPCDatePickerShadowNode &>(shadowNode);
            auto &layoutableShadowNode =
                static_cast<YogaLayoutableShadowNode &>(pickerShadowNode);

            auto state =
                std::static_pointer_cast<
                    const MeasuringPCDatePickerShadowNode::ConcreteState
                >(shadowNode.getState());

            if (state)
            {
                auto stateData = state->getData();
                auto frameSize = stateData.frameSize;

                if (frameSize.width >= 0 && frameSize.height >= 0)
                {
                    layoutableShadowNode.setSize(Size{
                        frameSize.width,
                        frameSize.height,
                    });
                }
            }

            ConcreteComponentDescriptor::adopt(shadowNode);
        }
    };

} // namespace facebook::react
