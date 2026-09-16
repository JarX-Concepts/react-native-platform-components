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
          PCLiquidGlassViewManager(),
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
        ReactModuleInfo(
          name = PCNativeThemeModule.NAME,
          className = PCNativeThemeModule::class.java.name,
          canOverrideExistingModule = false,
          needsEagerInit = false,
          isCxxModule = false,
          isTurboModule = true,
        )
    )
  }
}
