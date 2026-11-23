package com.platformcomponents

import android.view.View
import android.view.ViewTreeObserver

/**
 * Scheduling for the measure/layout pass a library view runs on itself.
 *
 * React Native's views ignore requestLayout (Yoga places them), so a library view
 * that changes its own subtree after mounting (rebuilt for a prop change or a
 * native theme change, an icon that finished loading) measures and lays itself out.
 *
 * That pass has to happen before the next frame is drawn. A rebuild removes and
 * adds child views, which schedules a traversal right away, and the traversal
 * holds back ordinary messages until it has drawn. A pass queued with
 * `View.post` alone therefore ran one frame late, and that frame drew the new
 * children unmeasured: the widget blanked for a frame on every rebuild, which
 * showed on every light/dark or brand color switch.
 */
internal object PCManualLayout {
  /**
   * Runs [pass] before the next frame is drawn, and again on the next loop of the
   * main thread, which covers the case where no frame is drawn. [pass] checks
   * and clears the view's pending flag, so only the first of the two lays out.
   */
  fun beforeNextDraw(view: View, pass: () -> Unit) {
    if (view.isAttachedToWindow) {
      val observer = view.viewTreeObserver
      observer.addOnPreDrawListener(object : ViewTreeObserver.OnPreDrawListener {
        override fun onPreDraw(): Boolean {
          if (observer.isAlive) observer.removeOnPreDrawListener(this)
          pass()
          // The pass lays the subtree out in place, so this frame can draw it.
          return true
        }
      })
    }
    view.post { pass() }
  }

  /**
   * Measures and lays [view] out again in the frame it already has, after it was
   * measured at other widths to work out an intrinsic size to report to Fabric.
   *
   * Measuring alone isn't enough. View.measure caches sizes by measure spec, and a
   * cache hit hands back the laid-out size without running onMeasure, so a label
   * kept the text layout of the last probe: a centred label was drawn at the start
   * of a button stretched wider than it (#171). forceLayout() clears that cache,
   * and layout() re-measures any descendant that got a cache hit of its own.
   * Does nothing before the view's first layout.
   */
  fun restoreLaidOutSize(view: View) {
    if (view.width <= 0 || view.height <= 0) return
    view.forceLayout()
    view.measure(
      View.MeasureSpec.makeMeasureSpec(view.width, View.MeasureSpec.EXACTLY),
      View.MeasureSpec.makeMeasureSpec(view.height, View.MeasureSpec.EXACTLY)
    )
    view.layout(view.left, view.top, view.right, view.bottom)
  }
}
