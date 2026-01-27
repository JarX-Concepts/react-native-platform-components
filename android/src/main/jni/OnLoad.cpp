#include <fbjni/fbjni.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/PlatformComponentsViewSpec/ComponentDescriptors.h>

#include "PCSelectionMenuShadowNode-custom.h"
#include "PCSelectionMenuComponentDescriptors-custom.h"

namespace facebook::react {

// Define the component name (must match the codegen-generated one)
// Note: This is declared extern in multiple places, we define it once here
const char PCSelectionMenuComponentName[] = "PCSelectionMenu";

} // namespace facebook::react

// Export our custom component descriptor registration
// This function should be called by the app instead of the codegen-generated one
extern "C" void PlatformComponents_registerCustomComponentDescriptors(
    std::shared_ptr<const facebook::react::ComponentDescriptorProviderRegistry> registry) {
  using namespace facebook::react;

  // Register SelectionMenu with our custom measuring shadow node
  registry->add(concreteComponentDescriptorProvider<MeasuringPCSelectionMenuComponentDescriptor>());

  // DatePicker uses the default generated descriptor
  registry->add(concreteComponentDescriptorProvider<PCDatePickerComponentDescriptor>());
}

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, [] {
    // Library loaded
  });
}
