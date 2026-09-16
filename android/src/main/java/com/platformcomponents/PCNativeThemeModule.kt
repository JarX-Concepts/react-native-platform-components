package com.platformcomponents

import android.util.Log
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.UiThreadUtil

/** `setNativeTheme` / `useNativeTheme` on Android. See [PCNativeTheme]. */
class PCNativeThemeModule(reactContext: ReactApplicationContext) :
  NativePlatformComponentsThemeSpec(reactContext) {

  override fun setTheme(theme: ReadableMap) {
    val primary: Any? =
      when (if (theme.hasKey("primary")) theme.getType("primary") else ReadableType.Null) {
        ReadableType.Number -> theme.getDouble("primary")
        ReadableType.Map -> theme.getMap("primary")
        else -> null
      }

    UiThreadUtil.runOnUiThread {
      val activity = reactApplicationContext.currentActivity
      val color =
        primary?.let {
          try {
            // Resolves PlatformColor resource paths as well as plain colors.
            ColorPropConverter.getColor(it, activity ?: reactApplicationContext)
          } catch (e: RuntimeException) {
            Log.w(TAG, "setNativeTheme: could not resolve colors.primary", e)
            null
          }
        }
      PCNativeTheme.setPrimaryColor(activity, color)
    }
  }

  companion object {
    const val NAME = "PlatformComponentsTheme"
    private const val TAG = "PlatformComponents"
  }
}
