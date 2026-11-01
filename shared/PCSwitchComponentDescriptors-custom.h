#pragma once

#include <react/renderer/core/ConcreteComponentDescriptor.h>

// Forward declaration to avoid circular includes
namespace facebook::react {
class MeasuringPCSwitchShadowNode;
}

// Include the actual shadow node definition
#include "PCSwitchShadowNode-custom.h"

namespace facebook::react {

/**
 * Custom component descriptor that uses our measuring shadow node
 * instead of the generated one.
 */
using MeasuringPCSwitchComponentDescriptor =
    ConcreteComponentDescriptor<MeasuringPCSwitchShadowNode>;

} // namespace facebook::react
