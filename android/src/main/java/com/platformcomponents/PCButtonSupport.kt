package com.platformcomponents

import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.drawable.BitmapDrawable
import android.util.TypedValue
import android.widget.TextView
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper
import com.facebook.react.views.text.ReactTypefaceUtils
import com.google.android.material.button.MaterialButton

/** Icon, font and color handling shared by Button and ButtonGroup. */
object PCButtonSupport {
  data class Icon(
    /** "", "sfSymbol" (ignored on Android), "drawable" or "image" */
    val type: String,
    val name: String,
    val uri: String,
    val scale: Float,
    val tinted: Boolean
  ) {
    val isPresent: Boolean get() = type == "drawable" || type == "image"
  }

  val NO_ICON = Icon("", "", "", 1f, true)

  fun ReadableMap.stringOr(key: String, fallback: String): String =
    if (hasKey(key) && !isNull(key)) getString(key) ?: fallback else fallback

  fun ReadableMap.doubleOr(key: String, fallback: Double): Double =
    if (hasKey(key) && !isNull(key)) getDouble(key) else fallback

  /** Reads the flat icon fields (iconType, iconName, ...) from a props map. */
  fun parseIcon(map: ReadableMap?): Icon {
    if (map == null) return NO_ICON
    val scale = map.doubleOr("iconScale", 1.0)
    return Icon(
      type = map.stringOr("iconType", ""),
      name = map.stringOr("iconName", ""),
      uri = map.stringOr("iconUri", ""),
      scale = if (scale > 0) scale.toFloat() else 1f,
      tinted = map.stringOr("iconTinted", "true") != "false"
    )
  }

  /**
   * Resolves a button's icon. Drawable names and release-bundled assets (which
   * React Native ships as drawable resources) resolve synchronously; other image
   * URIs load in the background and are applied when they arrive, if
   * [isCurrent] still holds.
   */
  fun applyIcon(button: MaterialButton, icon: Icon, isCurrent: () -> Boolean, onLoaded: () -> Unit) {
    if (!icon.tinted) {
      button.iconTint = null
    }
    val context = button.context
    when (icon.type) {
      "drawable" -> {
        button.icon = ResourceDrawableIdHelper.instance.getResourceDrawable(context, icon.name)
      }
      "image" -> {
        val uri = icon.uri
        if (!uri.contains(':')) {
          button.icon = ResourceDrawableIdHelper.instance.getResourceDrawable(context, uri)
        } else {
          PCImageLoader.load(context, uri, icon.scale) { bitmap ->
            if (bitmap == null || !isCurrent()) return@load
            button.icon = BitmapDrawable(context.resources, bitmap)
            onLoaded()
          }
        }
      }
    }
  }

  /** Applies the label font on top of the style's; empty / 0 keep the default. */
  fun applyFont(button: TextView, family: String, size: Float, weight: String, style: String) {
    if (size > 0) {
      button.setTextSize(TypedValue.COMPLEX_UNIT_SP, size)
    }
    if (family.isNotEmpty() || weight.isNotEmpty() || style.isNotEmpty()) {
      button.typeface = ReactTypefaceUtils.applyStyles(
        button.typeface,
        ReactTypefaceUtils.parseFontStyle(style.ifEmpty { null }),
        ReactTypefaceUtils.parseFontWeight(weight.ifEmpty { null }),
        family.ifEmpty { null },
        button.context.assets
      )
    }
  }

  /**
   * Applies the color props on top of the style's colors, keeping the style's
   * disabled colors.
   */
  fun applyColors(
    button: MaterialButton,
    container: Int?,
    foreground: Int?,
    ripple: Int?,
    stroke: Int?,
    iconTinted: Boolean
  ) {
    val disabledState = intArrayOf(-android.R.attr.state_enabled)
    val states = arrayOf(disabledState, intArrayOf())

    container?.let { color ->
      val theme = button.backgroundTintList
      val disabled = theme?.getColorForState(disabledState, theme.defaultColor) ?: Color.TRANSPARENT
      button.backgroundTintList = ColorStateList(states, intArrayOf(disabled, color))
    }

    foreground?.let { color ->
      val theme = button.textColors
      val disabled = theme.getColorForState(disabledState, theme.defaultColor)
      val tint = ColorStateList(states, intArrayOf(disabled, color))
      button.setTextColor(tint)
      if (iconTinted) {
        button.iconTint = tint
      }
    }

    ripple?.let { button.rippleColor = ColorStateList.valueOf(it) }
    stroke?.let { button.strokeColor = ColorStateList.valueOf(it) }
  }
}
