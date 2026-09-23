package com.platformcomponents

import android.content.Context
import android.os.Build
import android.content.res.Resources
import android.util.Log
import android.util.TypedValue
import android.view.ContextThemeWrapper
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.annotation.AttrRes
import androidx.appcompat.R as AppCompatR
import androidx.core.content.res.ResourcesCompat
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

  /**
   * Caps [view]'s text size at [maxMultiplier] times its size at the default
   * font scale (React Native's maxFontSizeMultiplier); no-op below 1 or when
   * the system scale is within the cap. The capped size is remembered on the
   * view, so repeated calls leave it alone until something else sets a size.
   */
  fun capTextSize(view: TextView, maxMultiplier: Float) {
    val resources = view.resources
    val fontScale = resources.configuration.fontScale
    val capped = view.getTag(R.id.pc_capped_text_size) as? Float
    val px = view.textSize
    if (capped != null && capped == px) return
    if (maxMultiplier < 1f || fontScale <= maxMultiplier) return
    val metrics = resources.displayMetrics
    // The size in sp the view was given, undoing the (possibly non-linear) scale
    val sp = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      TypedValue.deriveDimension(TypedValue.COMPLEX_UNIT_SP, px, metrics)
    } else {
      px / (metrics.density * fontScale)
    }
    val max = sp * metrics.density * maxMultiplier
    if (px <= max) return
    view.setTextSize(TypedValue.COMPLEX_UNIT_PX, max)
    view.setTag(R.id.pc_capped_text_size, view.textSize)
  }

  /** [capTextSize] for every TextView under [root]. */
  fun capTextSizes(root: View, maxMultiplier: Float) {
    if (maxMultiplier < 1f || root.resources.configuration.fontScale <= maxMultiplier) return
    if (root is TextView) capTextSize(root, maxMultiplier)
    if (root is ViewGroup) {
      for (i in 0 until root.childCount) capTextSizes(root.getChildAt(i), maxMultiplier)
    }
  }

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
    val base =
      if (hasMaterialTheme(context)) {
        context
      } else {
        warnMaterial(component)
        ContextThemeWrapper(context, MaterialR.style.Theme_Material3_DayNight_NoActionBar)
      }
    if (!PCNativeTheme.isActive) return base
    // Re-applies the native theme's brand colors, which the Material 3 fallback resets.
    return ContextThemeWrapper(base, R.style.PCNativeThemeOverlay)
  }

  /**
   * Clears AndroidX's color state list cache for the themes the views under [root] were
   * built with. Material widgets load their colors through that cache, keyed by theme,
   * and widgets rebuilt for a new brand color use the same theme keys as the ones they
   * replace, so without this they would get the previous brand colors back.
   */
  fun clearColorStateListCaches(root: View) {
    val themes = HashSet<Resources.Theme>()
    fun collect(view: View) {
      themes.add(view.context.theme)
      if (view is ViewGroup) {
        for (i in 0 until view.childCount) collect(view.getChildAt(i))
      }
    }
    collect(root)
    themes.forEach { ResourcesCompat.clearCachesForTheme(it) }
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
   * [nativeThemeFallback] is the variant that keeps the native theme's brand colors.
   */
  fun materialDialogThemeOverride(
    context: Context,
    component: String,
    fallbackTheme: Int,
    nativeThemeFallback: Int
  ): Int {
    if (hasMaterialTheme(context)) return 0
    warnMaterial(component)
    return if (PCNativeTheme.isActive) nativeThemeFallback else fallbackTheme
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
