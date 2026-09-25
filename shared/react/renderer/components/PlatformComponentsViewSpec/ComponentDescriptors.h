#pragma once

// Include the codegen-generated component descriptors using include_next
// This allows us to shadow the header while still including the original
#include_next <react/renderer/components/PlatformComponentsViewSpec/ComponentDescriptors.h>

// Include our custom component descriptors which use measuring shadow nodes
#include "PCSelectionMenuComponentDescriptors-custom.h"
#include "PCDatePickerComponentDescriptors-custom.h"
#include "PCSegmentedControlComponentDescriptors-custom.h"
#include "PCButtonComponentDescriptors-custom.h"
#include "PCButtonGroupComponentDescriptors-custom.h"
#include "PCTextFieldComponentDescriptors-custom.h"
#include "PCTabBarComponentDescriptors-custom.h"
#include "PCNavigationRailComponentDescriptors-custom.h"
#include "PCFloatingActionButtonComponentDescriptors-custom.h"
