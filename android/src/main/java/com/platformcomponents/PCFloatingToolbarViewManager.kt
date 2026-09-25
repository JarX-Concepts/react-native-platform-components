package com.platformcomponents

import android.view.View
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.PCFloatingToolbarManagerDelegate
import com.facebook.react.viewmanagers.PCFloatingToolbarManagerInterface
import com.platformcomponents.PCButtonSupport.stringOr

/**
 * Android ViewManager for FloatingToolbar. Uses ViewGroupManager since the
 * toolbar hosts React children.
 */
class PCFloatingToolbarViewManager :
  ViewGroupManager<PCFloatingToolbarView>(),
  PCFloatingToolbarManagerInterface<PCFloatingToolbarView> {

  companion object {
    private const val TAG = "PCFloatingToolbar"
  }

  private val delegate: ViewManagerDelegate<PCFloatingToolbarView> =
    PCFloatingToolbarManagerDelegate(this)

  override fun getName(): String = "PCFloatingToolbar"

  override fun getDelegate(): ViewManagerDelegate<PCFloatingToolbarView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): PCFloatingToolbarView {
    return PCFloatingToolbarView(reactContext)
  }

  // Colors arrive already processed by React Native (ARGB ints)
  override fun setColor(view: PCFloatingToolbarView, value: Int?) {
    view.applyColor(value)
  }

  override fun setScrollViewNativeID(view: PCFloatingToolbarView, value: String?) {
    view.applyScrollViewNativeID(value ?: "")
  }

  override fun setHideOnScroll(view: PCFloatingToolbarView, value: Boolean) {
    view.applyHideOnScroll(value)
  }

  override fun setIos(view: PCFloatingToolbarView, value: ReadableMap?) {
    // iOS props are ignored on Android
  }

  // android: {variant}
  override fun setAndroid(view: PCFloatingToolbarView, value: ReadableMap?) {
    view.applyVariant(value?.stringOr("variant", "standard"))
  }

  // --- ViewGroupManager child management ---
  override fun addView(parent: PCFloatingToolbarView, child: View, index: Int) {
    parent.addView(child, index)
  }

  override fun removeViewAt(parent: PCFloatingToolbarView, index: Int) {
    parent.removeViewAt(index)
  }

  override fun getChildCount(parent: PCFloatingToolbarView): Int {
    return parent.childCount
  }

  override fun getChildAt(parent: PCFloatingToolbarView, index: Int): View? {
    return parent.getChildAt(index)
  }
}
