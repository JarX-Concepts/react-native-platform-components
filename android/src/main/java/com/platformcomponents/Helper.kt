package com.platformcomponents

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import androidx.fragment.app.FragmentActivity
import com.facebook.react.uimanager.ThemedReactContext

public fun Context.findActivity(): Activity? {
  var c: Context? = this
  while (c is ContextWrapper) {
    if (c is Activity) return c
    c = c.baseContext
  }
  return null
}

public fun Context.findFragmentActivity(): FragmentActivity? {
  // RN best-case
  val trc = this as? ThemedReactContext
  val a1 = trc?.currentActivity
  if (a1 is FragmentActivity) return a1

  // fallback unwrap
  val a2 = this.findActivity()
  return a2 as? FragmentActivity
}
