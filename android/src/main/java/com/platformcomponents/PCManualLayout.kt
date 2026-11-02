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
}
