package com.platformcomponents

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

class PlatformComponentsViewPackage : BaseReactPackage() {
  override fun createViewManagers(
      reactContext: ReactApplicationContext
  ): List<ViewManager<*, *>> {
      return listOf(
          PCSelectionMenuViewManager(),
          PCDatePickerViewManager(),
          PCContextMenuViewManager(),
          PCSegmentedControlViewManager(),
          PCButtonViewManager(),
          PCButtonGroupViewManager(),
          PCFloatingToolbarViewManager(),
          PCLiquidGlassViewManager(),
          PCLiquidGlassContainerViewManager(),
          PCTextFieldViewManager(),
          PCTabBarViewManager(),
          PCNavigationRailViewManager(),
      )
  }

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    when (name) {
      PCNativeThemeModule.NAME -> PCNativeThemeModule(reactContext)
      else -> null
    }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
      PCNativeThemeModule.NAME to
        // Positional arguments on purpose: React Native 0.76 names the
        // parameters of this constructor `_name` / `_className`, so named
        // arguments only compile against newer releases.
        ReactModuleInfo(
          PCNativeThemeModule.NAME,
          PCNativeThemeModule::class.java.name,
          /* canOverrideExistingModule = */ false,
          /* needsEagerInit = */ false,
          /* isCxxModule = */ false,
          /* isTurboModule = */ true,
        )
    )
  }
}
