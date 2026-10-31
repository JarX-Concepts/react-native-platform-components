package com.platformcomponents

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.PCProgressIndicatorManagerDelegate
import com.facebook.react.viewmanagers.PCProgressIndicatorManagerInterface

class PCProgressIndicatorViewManager :
  SimpleViewManager<PCProgressIndicatorView>(),
  PCProgressIndicatorManagerInterface<PCProgressIndicatorView> {

  private val delegate: ViewManagerDelegate<PCProgressIndicatorView> =
    PCProgressIndicatorManagerDelegate(this)

  override fun getName(): String = "PCProgressIndicator"

  override fun getDelegate(): ViewManagerDelegate<PCProgressIndicatorView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): PCProgressIndicatorView =
    PCProgressIndicatorView(reactContext)

  // "linear" | "circular" | "loading"
  override fun setVariant(view: PCProgressIndicatorView, value: String?) {
    view.variant = when (value) {
      "circular", "loading" -> value
      else -> "linear"
    }
  }

  // 0..1; negative = indeterminate
  override fun setProgress(view: PCProgressIndicatorView, value: Double) {
    view.progress = value
  }

  // Colors arrive already processed by React Native (ARGB ints)
  override fun setColor(view: PCProgressIndicatorView, value: Int?) {
    view.indicatorColor = value
  }

  override fun setTrackColor(view: PCProgressIndicatorView, value: Int?) {
    view.trackColor = value
  }

  // "small" | "large" | ""
  override fun setSize(view: PCProgressIndicatorView, value: String?) {
    view.size = value ?: ""
  }

  override fun setSegments(view: PCProgressIndicatorView, value: Int) {
    view.segments = value
  }

  // android: { wavy: 'true' | 'false' }
  override fun setAndroid(view: PCProgressIndicatorView, value: ReadableMap?) {
    view.wavy =
      value != null && value.hasKey("wavy") && !value.isNull("wavy") && value.getString("wavy") == "true"
  }

  /** Applies the props of an update together, once they are all in. */
  override fun onAfterUpdateTransaction(view: PCProgressIndicatorView) {
    super.onAfterUpdateTransaction(view)
    view.commit()
  }
}
