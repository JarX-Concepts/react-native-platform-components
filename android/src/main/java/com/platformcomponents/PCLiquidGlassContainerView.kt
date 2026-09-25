package com.platformcomponents

import android.content.Context
import android.view.ViewGroup

/**
 * Android implementation of LiquidGlassContainer.
 *
 * Glass containers are an iOS 26 feature, so on Android this is a plain
 * container: React lays out the children, and `spacing` has no effect.
 */
class PCLiquidGlassContainerView(context: Context) : ViewGroup(context) {

    init {
        clipChildren = false
        clipToPadding = false
    }

    // ---- Layout ----
    // Fabric sizes this view and positions its children.

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
