#pragma once

#include <react/renderer/core/ConcreteComponentDescriptor.h>

// Forward declaration to avoid circular includes
namespace facebook::react {
class MeasuringPCButtonShadowNode;
}

// Include the actual shadow node definition
#include "PCButtonShadowNode-custom.h"

namespace facebook::react {

/**
 * Custom component descriptor that uses our measuring shadow node
 * instead of the generated one.
 */
using MeasuringPCButtonComponentDescriptor =
    ConcreteComponentDescriptor<MeasuringPCButtonShadowNode>;

} // namespace facebook::react
