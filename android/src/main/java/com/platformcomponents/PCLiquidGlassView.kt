package com.platformcomponents

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.View
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
        val bgColor = fallbackBackgroundColor?.let { parseColor(it) }

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

    private fun parseColor(colorString: String): Int? {
        return try {
            var sanitized = colorString.trim()
            if (!sanitized.startsWith("#")) {
                sanitized = "#$sanitized"
            }

            // Handle #RRGGBBAA format (web/CSS style) by converting to #AARRGGBB (Android style)
            if (sanitized.length == 9) {
                val rrggbb = sanitized.substring(1, 7)
                val aa = sanitized.substring(7, 9)
                sanitized = "#$aa$rrggbb"
            }

            Color.parseColor(sanitized)
        } catch (e: Exception) {
            null
        }
    }

    // ---- Measurement ----

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        // Standard FrameLayout measurement
        super.onMeasure(widthMeasureSpec, heightMeasureSpec)
    }
}
