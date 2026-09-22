package com.platformcomponents

import android.content.Context
import android.view.ContextThemeWrapper
import androidx.appcompat.R as AppCompatR
import com.google.android.material.R as MaterialR
import com.google.android.material.button.MaterialButton

/**
 * Material 3 Expressive contexts and styles for Button and ButtonGroup.
 *
 * The Expressive look is a set of widget styles (PCExpressiveOverlay in
 * styles.xml) layered over the host theme, plus one of Material's size overlays,
 * which the Expressive button styles read their padding, icon size, label style
 * and shapes from.
 */
object PCExpressive {
  enum class Variant { FILLED, TONAL, OUTLINED, TEXT, ELEVATED }

  fun parseVariant(value: String?): Variant =
    when (value) {
      "tonal" -> Variant.TONAL
      "outlined" -> Variant.OUTLINED
      "text" -> Variant.TEXT
      "elevated" -> Variant.ELEVATED
      else -> Variant.FILLED
    }

  /** "xsmall" | "small" | "medium" | "large" | "xlarge" */
  fun parseSize(value: String?): String =
    when (value) {
      "xsmall", "medium", "large", "xlarge" -> value
      else -> "small"
    }

  /** "round" | "square"; the spec's empty string is the Material default, round. */
  fun parseShape(value: String?): String = if (value == "square") "square" else "round"

  /**
   * The theme overlay choosing the buttons' size and shape (PCSize.* in
   * styles.xml): it sets the size overlay attributes the library's button
   * styles read, for text buttons and for icon-only buttons, which use
   * Material's square icon button sizes.
   */
  fun sizeOverlay(size: String, shape: String): Int {
    val square = shape == "square"
    return when (size) {
      "xsmall" -> if (square) R.style.PCSize_Xsmall_Square else R.style.PCSize_Xsmall
      "medium" -> if (square) R.style.PCSize_Medium_Square else R.style.PCSize_Medium
      "large" -> if (square) R.style.PCSize_Large_Square else R.style.PCSize_Large
      "xlarge" -> if (square) R.style.PCSize_Xlarge_Square else R.style.PCSize_Xlarge
      else -> if (square) R.style.PCSize_Small_Square else R.style.PCSize_Small
    }
  }

  /** The theme attribute naming the widget style for a variant. */
  fun styleAttr(variant: Variant, iconOnly: Boolean): Int =
    if (iconOnly) {
      when (variant) {
        Variant.FILLED -> MaterialR.attr.materialIconButtonFilledStyle
        Variant.TONAL -> MaterialR.attr.materialIconButtonFilledTonalStyle
        Variant.OUTLINED -> MaterialR.attr.materialIconButtonOutlinedStyle
        Variant.TEXT, Variant.ELEVATED -> MaterialR.attr.materialIconButtonStyle
      }
    } else {
      when (variant) {
        Variant.FILLED -> MaterialR.attr.materialButtonStyle
        Variant.TONAL -> MaterialR.attr.materialButtonTonalStyle
        Variant.OUTLINED -> MaterialR.attr.materialButtonOutlinedStyle
        Variant.TEXT -> AppCompatR.attr.borderlessButtonStyle
        Variant.ELEVATED -> MaterialR.attr.materialButtonElevatedStyle
      }
    }

  /**
   * Creates an Expressive button. [base] is a Material 3 context (see
   * PCThemeSupport.materialContext); [toolbarOverlay] is the enclosing
   * FloatingToolbar's button overlay, or 0 outside a toolbar.
   *
   * The toolbar overlay replaces the filled, text and standard icon button
   * styles with the toolbar's, as it does for XML children of a
   * FloatingToolbarLayout; the other variants keep their Expressive styles.
   */
  fun createButton(
    base: Context,
    variant: Variant,
    size: String,
    shape: String,
    iconOnly: Boolean,
    toolbarOverlay: Int
  ): MaterialButton {
    val expressive = ContextThemeWrapper(base, R.style.PCExpressiveOverlay)
    val themed = if (toolbarOverlay != 0) ContextThemeWrapper(expressive, toolbarOverlay) else expressive
    val sized = ContextThemeWrapper(themed, sizeOverlay(size, shape))
    return MaterialButton(sized, null, styleAttr(variant, iconOnly))
  }
}
