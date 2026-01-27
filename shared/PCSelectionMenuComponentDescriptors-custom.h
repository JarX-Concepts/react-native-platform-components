#pragma once

#include <react/renderer/core/ConcreteComponentDescriptor.h>

// Forward declaration to avoid circular includes
namespace facebook::react {
class MeasuringPCSelectionMenuShadowNode;
}

// Include the actual shadow node definition
#include "PCSelectionMenuShadowNode-custom.h"

namespace facebook::react {

/**
 * Custom component descriptor that uses our measuring shadow node
 * instead of the generated one.
 */
using MeasuringPCSelectionMenuComponentDescriptor =
    ConcreteComponentDescriptor<MeasuringPCSelectionMenuShadowNode>;

} // namespace facebook::react
