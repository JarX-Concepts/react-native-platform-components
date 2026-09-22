package com.platformcomponents

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Color
import androidx.core.content.res.ResourcesCompat
import com.google.android.material.R as MaterialR
import com.google.android.material.color.MaterialColors
import com.google.android.material.floatingtoolbar.FloatingToolbarLayout
import com.google.android.material.shape.MaterialShapeDrawable

/**
 * A Material 3 floating toolbar. The Material container (shape, elevation,
 * color) hosts React children, which Fabric lays out itself.
 */
class PCFloatingToolbarView(context: Context) :
  FloatingToolbarLayout(
    // Material widgets need a Material theme; fall back to Material 3 defaults instead of crashing.
    PCThemeSupport.materialContext(context, "FloatingToolbar"),
    null,
    0,
    R.style.PCFloatingToolbar
  ) {

  companion object {
    private const val TAG = "PCFloatingToolbar"
  }

  // --- Props ---
  var variant: String = "standard" // "standard" | "vibrant"
  var color: Int? = null

  /** The button overlay for Buttons inside this toolbar (see PCButtonView). */
  val buttonOverlay: Int
    get() = if (variant == "vibrant") R.style.PCToolbarOverlay_Vibrant else R.style.PCToolbarOverlay

  // --- Native theme ---
  private val nativeThemeListener = PCNativeTheme.Listener {
    ResourcesCompat.clearCachesForTheme(context.theme)
    applyColors()
  }

  init {
    clipChildren = false
    clipToPadding = false
    applyColors()
  }

  // ---- Public apply* (called by manager) ----

  fun applyVariant(value: String?) {
    val parsed = if (value == "vibrant") "vibrant" else "standard"
    if (variant == parsed) return
    variant = parsed
    applyColors()
    // Buttons inside take the toolbar's button styles
    for (i in 0 until childCount) {
      (getChildAt(i) as? PCButtonView)?.refreshToolbarStyle()
    }
  }

  fun applyColor(value: Int?) {
    if (color == value) return
    color = value
    applyColors()
  }

  /**
   * A `backgroundColor` style would replace the Material shape; route it into
   * the color instead. React Native resets it with transparent.
   */
  override fun setBackgroundColor(color: Int) {
    applyColor(if (color == Color.TRANSPARENT) null else color)
  }

  private fun applyColors() {
    val resolved = color ?: MaterialColors.getColor(
      this,
      if (variant == "vibrant") MaterialR.attr.colorPrimaryContainer else MaterialR.attr.colorSurfaceContainer,
      Color.TRANSPARENT
    )
    val shape = background as? MaterialShapeDrawable
    if (shape != null) {
      shape.fillColor = ColorStateList.valueOf(resolved)
    } else {
      backgroundTintList = ColorStateList.valueOf(resolved)
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    PCNativeTheme.addListener(nativeThemeListener)
    PCNativeTheme.attach(context)
  }

  override fun onDetachedFromWindow() {
    PCNativeTheme.removeListener(nativeThemeListener)
    super.onDetachedFromWindow()
  }

  // ---- Layout ----
  // Fabric sizes this view and positions its children; FrameLayout must not
  // re-measure or re-position them against its own padding and gravity.

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    setMeasuredDimension(
      MeasureSpec.getSize(widthMeasureSpec),
      MeasureSpec.getSize(heightMeasureSpec)
    )
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    // No-op: Fabric lays out the children
  }
}
