package com.platformcomponents

import android.graphics.Color
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.PlatformComponentsViewManagerInterface
import com.facebook.react.viewmanagers.PlatformComponentsViewManagerDelegate

@ReactModule(name = PlatformComponentsViewManager.NAME)
class PlatformComponentsViewManager : SimpleViewManager<PlatformComponentsView>(),
  PlatformComponentsViewManagerInterface<PlatformComponentsView> {
  private val mDelegate: ViewManagerDelegate<PlatformComponentsView>

  init {
    mDelegate = PlatformComponentsViewManagerDelegate(this)
  }

  override fun getDelegate(): ViewManagerDelegate<PlatformComponentsView>? {
    return mDelegate
  }

  override fun getName(): String {
    return NAME
  }

  public override fun createViewInstance(context: ThemedReactContext): PlatformComponentsView {
    return PlatformComponentsView(context)
  }

  @ReactProp(name = "color")
  override fun setColor(view: PlatformComponentsView?, color: String?) {
    view?.setBackgroundColor(Color.parseColor(color))
  }

  companion object {
    const val NAME = "PlatformComponentsView"
  }
}
