package com.platformcomponents

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.PCLiquidGlassManagerDelegate
import com.facebook.react.viewmanagers.PCLiquidGlassManagerInterface

/**
 * Android ViewManager for LiquidGlass.
 *
 * LiquidGlass is iOS-only, so this manager provides a stub implementation
 * that renders a basic FrameLayout with optional fallback styling.
 * Uses ViewGroupManager since LiquidGlass can contain children.
 */
class PCLiquidGlassViewManager :
    ViewGroupManager<PCLiquidGlassView>(),
    PCLiquidGlassManagerInterface<PCLiquidGlassView> {

    companion object {
        private const val TAG = "PCLiquidGlass"
    }

    private val delegate: ViewManagerDelegate<PCLiquidGlassView> =
        PCLiquidGlassManagerDelegate(this)

    override fun getName(): String = "PCLiquidGlass"

    override fun getDelegate(): ViewManagerDelegate<PCLiquidGlassView> = delegate

    override fun createViewInstance(reactContext: ThemedReactContext): PCLiquidGlassView {
        return PCLiquidGlassView(reactContext)
    }

    override fun setCornerRadius(view: PCLiquidGlassView, value: Float) {
        view.cornerRadius = value
    }

    override fun setIos(view: PCLiquidGlassView, value: ReadableMap?) {
        // iOS props are ignored on Android
    }

    override fun setAndroid(view: PCLiquidGlassView, value: ReadableMap?) {
        val fallbackColor = value?.let {
            if (it.hasKey("fallbackBackgroundColor") && !it.isNull("fallbackBackgroundColor")) {
                it.getString("fallbackBackgroundColor")
            } else null
        }
        view.fallbackBackgroundColor = fallbackColor
    }
}
