package com.platformcomponents

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.ColorStateList
import android.graphics.RectF
import android.graphics.drawable.BitmapDrawable
import android.view.ContextThemeWrapper
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.appcompat.R as AppCompatR
import androidx.core.graphics.ColorUtils
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper
import com.google.android.material.R as MaterialR
import com.google.android.material.chip.Chip
import com.google.android.material.chip.ChipDrawable
import com.google.android.material.color.MaterialColors

/**
 * Chip building shared by Chip and ChipGroup: Material 3 chips styled by
 * variant, their icons, and the views laid over their close icons.
 */
object PCChipSupport {
  /** One chip's content (a standalone Chip, or one of a ChipGroup's chips). */
  data class Item(
    val label: String,
    val value: String,
    val disabled: Boolean,
    val icon: PCButtonSupport.Icon,
    val closeIcon: Boolean,
    val testID: String,
    val closeTestID: String,
    val accessibilityLabel: String,
    val closeAccessibilityLabel: String
  )

  /** "assist" | "filter" | "input" | "suggestion"; anything else is assist. */
  fun parseVariant(value: String?): String =
    when (value) {
      "filter", "input", "suggestion" -> value
      else -> "assist"
    }

  private fun styleOverlay(variant: String): Int =
    when (variant) {
      "filter" -> R.style.PCChipOverlay_Filter
      "input" -> R.style.PCChipOverlay_Input
      "suggestion" -> R.style.PCChipOverlay_Suggestion
      else -> R.style.PCChipOverlay_Assist
    }

  /**
   * Creates a chip of [variant] with [item]'s content. [base] is a Material 3
   * context (see PCThemeSupport.materialContext). [checkable] makes it a
   * selectable chip; the caller sets `isChecked` and the listeners.
   */
  fun createChip(
    base: Context,
    variant: String,
    item: Item,
    checkable: Boolean,
    enabled: Boolean,
    maxFontSizeMultiplier: Float,
    isCurrent: () -> Boolean,
    onIconLoaded: () -> Unit
  ): Chip {
    val chip = Chip(ContextThemeWrapper(base, styleOverlay(variant)), null, MaterialR.attr.chipStyle)
    chip.text = item.label
    chip.isCheckable = checkable
    chip.isEnabled = enabled
    chip.contentDescription = item.accessibilityLabel.ifEmpty { null }
    chip.isCloseIconVisible = item.closeIcon
    chip.closeIconContentDescription = item.closeAccessibilityLabel.ifEmpty { null }
    // Detox's by.id matches the view tag
    chip.tag = item.testID.ifEmpty { null }
    applyIcon(chip, variant, item.icon, isCurrent, onIconLoaded)
    PCThemeSupport.capTextSize(chip, maxFontSizeMultiplier)
    return chip
  }

  /**
   * Resolves the chip's leading icon. Drawable names and release-bundled
   * assets resolve synchronously; other image URIs load in the background and
   * are applied when they arrive, if [isCurrent] still holds. The filter and
   * suggestion styles hide the chip icon by default, so it is shown whenever
   * there is one.
   */
  private fun applyIcon(
    chip: Chip,
    variant: String,
    icon: PCButtonSupport.Icon,
    isCurrent: () -> Boolean,
    onLoaded: () -> Unit
  ) {
    if (!icon.isPresent) {
      chip.isChipIconVisible = false
      return
    }
    chip.chipIconTint = if (icon.tinted) iconTint(chip, variant) else null
    chip.isChipIconVisible = true
    val context = chip.context
    when (icon.type) {
      "drawable" -> chip.chipIcon = ResourceDrawableIdHelper.instance.getResourceDrawable(context, icon.name)
      "image" -> {
        val uri = icon.uri
        if (!uri.contains(':')) {
          chip.chipIcon = ResourceDrawableIdHelper.instance.getResourceDrawable(context, uri)
        } else {
          PCImageLoader.load(context, uri, icon.scale, icon.request) { bitmap ->
            if (bitmap == null || !isCurrent()) return@load
            chip.chipIcon = BitmapDrawable(context.resources, bitmap)
            onLoaded()
          }
        }
      }
    }
  }

  /**
   * The Material 3 leading icon colors, which the chip styles leave to the
   * drawable: primary (on-surface-variant for input chips), the selected
   * colors while checked, and on-surface at 38% while disabled.
   */
  private fun iconTint(chip: Chip, variant: String): ColorStateList {
    val primary = MaterialColors.getColor(chip, AppCompatR.attr.colorPrimary)
    val onSurface = MaterialColors.getColor(chip, MaterialR.attr.colorOnSurface)
    val normal = if (variant == "input") MaterialColors.getColor(chip, MaterialR.attr.colorOnSurfaceVariant) else primary
    val checked = if (variant == "input") primary else MaterialColors.getColor(chip, MaterialR.attr.colorOnSecondaryContainer)
    return ColorStateList(
      arrayOf(
        intArrayOf(-android.R.attr.state_enabled),
        intArrayOf(android.R.attr.state_checked),
        intArrayOf()
      ),
      intArrayOf(ColorUtils.setAlphaComponent(onSurface, DISABLED_ALPHA), checked, normal)
    )
  }

  /** Material's disabled emphasis, 38%. */
  private const val DISABLED_ALPHA = 97

  /**
   * A transparent view laid over a chip's close icon, carrying the close
   * icon's testID. The close icon is part of the chip's drawable, reachable
   * only as a virtual accessibility node, which Detox's `by.id` (a view tag
   * match) can't find. The view forwards every touch to the chip, so the
   * chip's own close icon handling (pressed state, ripple, click) runs as if
   * the chip had been touched there. It is hidden from accessibility
   * services, which use the chip's virtual close icon node.
   */
  @SuppressLint("ViewConstructor")
  class CloseTarget(context: Context, val chip: Chip) : View(context) {
    private val chipLocation = IntArray(2)
    private val ownLocation = IntArray(2)

    init {
      importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
      isFocusable = false
      layoutParams = FrameLayout.LayoutParams(0, 0)
    }

    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean {
      if (!chip.isEnabled) return true
      getLocationInWindow(ownLocation)
      chip.getLocationInWindow(chipLocation)
      val forwarded = MotionEvent.obtain(event)
      forwarded.offsetLocation(
        (ownLocation[0] - chipLocation[0]).toFloat(),
        (ownLocation[1] - chipLocation[1]).toFloat()
      )
      chip.dispatchTouchEvent(forwarded)
      forwarded.recycle()
      return true
    }
  }

  /**
   * A frame that lays [targets] over their chips' close icons after its own
   * layout, wherever in its subtree the chips are.
   */
  class Host(context: Context) : FrameLayout(context) {
    val targets = mutableListOf<CloseTarget>()

    init {
      clipChildren = false
      clipToPadding = false
    }

    fun addTarget(target: CloseTarget) {
      targets.add(target)
      addView(target)
    }

    fun clearTargets() {
      targets.forEach { removeView(it) }
      targets.clear()
    }

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
      super.onLayout(changed, left, top, right, bottom)
      for (target in targets) {
        val (x, y) = offsetIn(target.chip, this)
        layoutCloseTarget(target, x, y)
      }
    }
  }

  private val closeBounds = RectF()

  /**
   * Lays [target] over its chip's close icon touch area. [offsetX] and
   * [offsetY] are the chip's position in the target's parent. Hidden (0 size)
   * when the chip has no close icon.
   */
  fun layoutCloseTarget(target: CloseTarget, offsetX: Int, offsetY: Int) {
    val chip = target.chip
    val drawable = chip.chipDrawable as? ChipDrawable
    if (drawable == null || !chip.isCloseIconVisible || chip.width == 0) {
      target.layout(0, 0, 0, 0)
      return
    }
    // The view sizes its background when it draws; the close icon's bounds
    // are needed now, so size it here (to what the draw would set)
    chip.background?.let { background ->
      if (background.bounds.width() != chip.width || background.bounds.height() != chip.height) {
        background.setBounds(0, 0, chip.width, chip.height)
      }
    }
    drawable.getCloseIconTouchBounds(closeBounds)
    target.layout(
      offsetX + closeBounds.left.toInt(),
      offsetY + closeBounds.top.toInt(),
      offsetX + closeBounds.right.toInt(),
      offsetY + closeBounds.bottom.toInt()
    )
  }

  /** The position of [child] in [ancestor], summing the views in between. */
  fun offsetIn(child: View, ancestor: ViewGroup): Pair<Int, Int> {
    var x = 0
    var y = 0
    var view: View = child
    while (view !== ancestor) {
      x += view.left
      y += view.top
      view = view.parent as? View ?: break
    }
    return x to y
  }
}
