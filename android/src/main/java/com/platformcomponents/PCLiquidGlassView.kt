package com.platformcomponents

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.widget.FrameLayout

/**
 * Android stub implementation for LiquidGlass.
 *
 * LiquidGlass is an iOS 26+ only feature. On Android, this component renders
 * as a regular FrameLayout with optional fallback styling (background color, corner radius).
 */
class PCLiquidGlassView(context: Context) : FrameLayout(context) {

    companion object {
        private const val TAG = "PCLiquidGlass"
    }

    // --- Props ---
    var cornerRadius: Float = 0f
        set(value) {
            field = value
            updateBackground()
        }

    /** "capsule" rounds to half the shorter side; anything else uses cornerRadius. */
    var cornerStyle: String = ""
        set(value) {
            field = value
            updateBackground()
        }

    var fallbackBackgroundColor: String? = null
        set(value) {
            field = value
            updateBackground()
        }

    init {
        // Ensure children can be rendered
        clipChildren = false
        clipToPadding = false
    }

    private fun cornerRadiusPx(): Float =
        if (cornerStyle == "capsule") minOf(width, height) / 2f
        else cornerRadius * resources.displayMetrics.density

    private fun updateBackground() {
        val bgColor = fallbackBackgroundColor?.let { ColorParser.parse(it) }
        val radius = cornerRadiusPx()

        if (radius > 0 || bgColor != null) {
            val drawable = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadii = FloatArray(8) { radius }
                setColor(bgColor ?: Color.TRANSPARENT)
            }
            background = drawable
            clipToOutline = radius > 0
            outlineProvider = android.view.ViewOutlineProvider.BACKGROUND
        } else {
            background = null
            clipToOutline = false
        }
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        // A capsule follows the size
        if (cornerStyle == "capsule") updateBackground()
    }

    // ---- Layout ----
    // Fabric sizes this view and positions its children; FrameLayout must not
    // re-measure or re-position them against its own gravity.

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
