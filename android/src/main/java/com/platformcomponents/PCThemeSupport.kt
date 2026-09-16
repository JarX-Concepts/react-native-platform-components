package com.platformcomponents

import android.content.Context
import android.util.Log
import android.util.TypedValue
import android.view.ContextThemeWrapper
import androidx.annotation.AttrRes
import androidx.appcompat.R as AppCompatR
import com.google.android.material.R as MaterialR

/**
 * Theme guards for the Material and AppCompat widgets this library creates.
 *
 * React Native and Expo templates ship an AppCompat app theme. Material widgets
 * (MaterialButtonToggleGroup, TextInputLayout, MaterialDatePicker, ...) throw during
 * inflation when the host theme is not a Material Components / Material 3 theme.
 * Rather than crash the app, wrap the context in a Material 3 theme (widgets) or
 * hand the picker dialogs a full Material 3 dialog theme, and warn once so the
 * developer knows how to get their own colors applied.
 */
internal object PCThemeSupport {
  private const val TAG = "PlatformComponents"

  @Volatile private var warnedMaterial = false
  @Volatile private var warnedAppCompat = false

  /** True for Theme.MaterialComponents.* and Theme.Material3.* (and descendants). */
  fun hasMaterialTheme(context: Context): Boolean =
    resolves(context, MaterialR.attr.materialButtonOutlinedStyle) &&
      resolves(context, MaterialR.attr.colorSurface)

  /** True for Theme.AppCompat.* and descendants, which includes every Material theme. */
  fun hasAppCompatTheme(context: Context): Boolean =
    resolves(context, AppCompatR.attr.alertDialogTheme)

  /**
   * Context to build Material widgets from. The host context when its theme is a
   * Material theme; otherwise a Theme.Material3.DayNight wrapper, so the widget
   * renders with Material 3 defaults instead of throwing.
   */
  fun materialContext(context: Context, component: String): Context {
    if (hasMaterialTheme(context)) return context
    warnMaterial(component)
    return ContextThemeWrapper(context, MaterialR.style.Theme_Material3_DayNight_NoActionBar)
  }

  /**
   * Context to build AppCompat dialogs from. The host context when its theme is an
   * AppCompat theme; otherwise a Theme.AppCompat.DayNight.Dialog.Alert wrapper.
   */
  fun appCompatDialogContext(context: Context, component: String): Context {
    if (hasAppCompatTheme(context)) return context
    warnAppCompat(component)
    return ContextThemeWrapper(context, AppCompatR.style.Theme_AppCompat_DayNight_Dialog_Alert)
  }

  /**
   * Theme override for MaterialDatePicker / MaterialTimePicker when the activity
   * theme is not a Material theme. Returns 0 (no override) when it is.
   */
  fun materialDialogThemeOverride(context: Context, component: String, fallbackTheme: Int): Int {
    if (hasMaterialTheme(context)) return 0
    warnMaterial(component)
    return fallbackTheme
  }

  private fun resolves(context: Context, @AttrRes attr: Int): Boolean =
    context.theme.resolveAttribute(attr, TypedValue(), true)

  private fun warnMaterial(component: String) {
    if (warnedMaterial) return
    warnedMaterial = true
    Log.w(
      TAG,
      "$component: the app theme is not a Material 3 theme, so Material components " +
        "fall back to Material 3 default colors. To use your app's colors, make " +
        "AppTheme inherit from Theme.Material3.DayNight.NoActionBar in " +
        "android/app/src/main/res/values/styles.xml (Expo: pass " +
        "{ android: { theme: 'material3' } } to the react-native-platform-components " +
        "config plugin). See the README section \"Android Theme Configuration\"."
    )
  }

  private fun warnAppCompat(component: String) {
    if (warnedAppCompat) return
    warnedAppCompat = true
    Log.w(
      TAG,
      "$component: the app theme is not an AppCompat theme, so system dialogs fall " +
        "back to Theme.AppCompat.DayNight.Dialog.Alert. Make AppTheme inherit from " +
        "Theme.AppCompat.* or Theme.Material3.* to style them with your theme."
    )
  }
}
