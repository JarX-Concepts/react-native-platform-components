package com.platformcomponents

import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.PCLiquidGlassContainerManagerDelegate
import com.facebook.react.viewmanagers.PCLiquidGlassContainerManagerInterface

/**
 * Android ViewManager for LiquidGlassContainer: a plain container, since
 * glass containers are iOS 26 only.
 */
class PCLiquidGlassContainerViewManager :
    ViewGroupManager<PCLiquidGlassContainerView>(),
    PCLiquidGlassContainerManagerInterface<PCLiquidGlassContainerView> {

    private val delegate: ViewManagerDelegate<PCLiquidGlassContainerView> =
        PCLiquidGlassContainerManagerDelegate(this)

    override fun getName(): String = "PCLiquidGlassContainer"

    override fun getDelegate(): ViewManagerDelegate<PCLiquidGlassContainerView> = delegate

    override fun createViewInstance(reactContext: ThemedReactContext): PCLiquidGlassContainerView {
        return PCLiquidGlassContainerView(reactContext)
    }

    override fun setSpacing(view: PCLiquidGlassContainerView, value: Float) {
        // Glass merging is iOS only
    }
}
