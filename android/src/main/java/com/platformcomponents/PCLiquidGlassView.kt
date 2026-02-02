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

    private fun updateBackground() {
        val bgColor = fallbackBackgroundColor?.let { ColorParser.parse(it) }

        if (cornerRadius > 0 || bgColor != null) {
            val drawable = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadii = FloatArray(8) { cornerRadius * resources.displayMetrics.density }
                setColor(bgColor ?: Color.TRANSPARENT)
            }
            background = drawable
            clipToOutline = cornerRadius > 0
            outlineProvider = android.view.ViewOutlineProvider.BACKGROUND
        } else {
            background = null
            clipToOutline = false
        }
    }

    // ---- Measurement ----

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        // Standard FrameLayout measurement
        super.onMeasure(widthMeasureSpec, heightMeasureSpec)
    }
}
