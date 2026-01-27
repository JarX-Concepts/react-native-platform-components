#pragma once

#include <react/renderer/core/ConcreteComponentDescriptor.h>

// Forward declaration to avoid circular includes
namespace facebook::react {
class MeasuringPCDatePickerShadowNode;
}

// Include the actual shadow node definition
#include "PCDatePickerShadowNode-custom.h"

namespace facebook::react {

/**
 * Custom component descriptor that uses our measuring shadow node
 * instead of the generated one. No custom adopt() needed since
 * measurement is handled via measureContent().
 */
using MeasuringPCDatePickerComponentDescriptor =
    ConcreteComponentDescriptor<MeasuringPCDatePickerShadowNode>;

} // namespace facebook::react
