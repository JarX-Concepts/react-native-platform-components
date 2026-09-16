package com.platformcomponents

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.os.Build
import android.util.Log
import androidx.core.content.OnConfigurationChangedProvider
import androidx.core.util.Consumer
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.ThemedReactContext
import com.google.android.material.color.DynamicColors
import com.google.android.material.color.DynamicColorsOptions
import java.lang.ref.WeakReference
import java.util.WeakHashMap

/**
 * The native theme set from JS with `useNativeTheme` / `setNativeTheme`.
 *
 * The brand color seeds Material dynamic colors on the activity, so Material and
 * AppCompat widgets created afterwards use a Material 3 scheme generated from it.
 * Content-based dynamic colors need Android 13+ (and some Android 12 devices); on
 * older versions the app's own theme colors stay in place.
 *
 * Widgets resolve theme colors when they are created, so library views register as
 * listeners and rebuild on every change: a new brand color, or a light/dark switch
 * (including `Appearance.setColorScheme`), which also needs the scheme regenerated.
 *
 * Main thread only.
 */
internal object PCNativeTheme {
  private const val TAG = "PlatformComponents"

  fun interface Listener {
    fun onNativeThemeChanged()
  }

  /** Brand color from JS, or null to use the app's theme colors. */
  var primaryColor: Int? = null
    private set

  /** Bumped on every change; views compare it to the version they were built with. */
  var version = 0
    private set

  /** True when widgets should re-apply the brand colors over their own theme. */
  val isActive: Boolean
    get() = primaryColor != null && DynamicColors.isDynamicColorAvailable()

  private data class Applied(val primaryColor: Int, val nightMode: Int)

  private var warnedUnsupported = false

  private val listeners = LinkedHashSet<Listener>()
  private val applied = WeakHashMap<Activity, Applied>()
  private val observed = WeakHashMap<Activity, Consumer<Configuration>>()

  fun addListener(listener: Listener) {
    listeners.add(listener)
  }

  fun removeListener(listener: Listener) {
    listeners.remove(listener)
  }

  fun setPrimaryColor(activity: Activity?, color: Int?) {
    UiThreadUtil.assertOnUiThread()
    if (color == primaryColor) return
    primaryColor = color
    activity?.let {
      observe(it)
      apply(it)
    }
    changed()
  }

  /**
   * Called when a library view attaches: follows its activity's configuration and
   * applies the current theme if the activity doesn't have it yet (for example after
   * the activity was recreated).
   */
  fun attach(context: Context) {
    val activity = findActivity(context) ?: return
    observe(activity)
    if (applied[activity] != wanted(activity)) {
      apply(activity)
      changed()
    }
  }

  fun findActivity(context: Context): Activity? {
    (context as? ThemedReactContext)?.currentActivity?.let { return it }
    var current: Context? = context
    while (current is ContextWrapper) {
      if (current is Activity) return current
      current = current.baseContext
    }
    return null
  }

  private fun nightMode(context: Context): Int =
    context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK

  /** What the activity should have applied: null when there is no brand color. */
  private fun wanted(activity: Activity): Applied? =
    primaryColor?.let { Applied(it, nightMode(activity)) }

  private fun apply(activity: Activity) {
    val color = primaryColor

    if (color == null) {
      // Re-applying the activity theme resets the color attributes the overlay set.
      if (applied.remove(activity) != null) {
        activityThemeResId(activity)?.let { activity.theme.applyStyle(it, true) }
      }
      return
    }

    applied[activity] = Applied(color, nightMode(activity))
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || !DynamicColors.isDynamicColorAvailable()) {
      if (!warnedUnsupported) {
        warnedUnsupported = true
        Log.w(TAG, "useNativeTheme: brand colors need Android 13 or later; keeping the app theme colors.")
      }
      return
    }

    // Generates the scheme for the activity's current light/dark mode, overrides the
    // Material "personalized" color resources with it and applies them to the theme.
    // Material 1.13+ is needed to apply it more than once to the same activity.
    DynamicColors.applyToActivityIfAvailable(
      activity,
      DynamicColorsOptions.Builder().setContentBasedSource(color).build()
    )
    activity.theme.applyStyle(R.style.PCNativeThemeOverlay, true)
  }

  private fun observe(activity: Activity) {
    if (observed.containsKey(activity)) return
    val provider = activity as? OnConfigurationChangedProvider ?: return

    // The listener lives as long as the activity; don't let it keep the activity alive.
    val activityRef = WeakReference(activity)
    var lastNightMode = nightMode(activity)
    val listener = Consumer<Configuration> { config ->
      val nightMode = config.uiMode and Configuration.UI_MODE_NIGHT_MASK
      if (nightMode == lastNightMode) return@Consumer
      lastNightMode = nightMode
      val current = activityRef.get() ?: return@Consumer
      // AppCompat re-applies the activity theme on a night mode switch, and the
      // scheme depends on the mode, so the brand colors are applied again.
      if (primaryColor != null) apply(current)
      changed()
    }
    provider.addOnConfigurationChangedListener(listener)
    observed[activity] = listener
  }

  private fun changed() {
    version += 1
    listeners.toList().forEach { it.onNativeThemeChanged() }
  }

  private fun activityThemeResId(activity: Activity): Int? =
    try {
      activity.packageManager.getActivityInfo(activity.componentName, 0).themeResource
        .takeIf { it != 0 }
        ?: activity.applicationInfo.theme.takeIf { it != 0 }
    } catch (_: PackageManager.NameNotFoundException) {
      null
    }
}
