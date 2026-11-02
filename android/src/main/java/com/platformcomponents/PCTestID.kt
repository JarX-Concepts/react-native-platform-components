package com.platformcomponents

import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityEvent
import android.os.Bundle
import androidx.core.view.AccessibilityDelegateCompat
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import androidx.core.view.accessibility.AccessibilityNodeProviderCompat

/**
 * Puts a `testID` on a native view inside a component: the view that carries
 * the accessibility label, takes the touches and reports the disabled state.
 *
 * Test tools find views two ways, and both have to land on that view:
 * - Detox and Espresso match `by.id` against the view tag.
 * - UI Automator, and the tools built on it (Maestro `id:`, Appium `id` /
 *   `resource-id`), only see the accessibility tree and match the node's
 *   resource-id. React Native fills that in for its own views from the
 *   `react_test_id` tag (ReactAccessibilityDelegate), which is why the
 *   components that move their testID inward leave that tag off their host:
 *   otherwise the host would expose the same resource-id, with no label.
 *
 * The resource-id comes from an accessibility delegate that wraps whatever
 * delegate the view already has (Material's chip touch helper, the toggle
 * group's collection info, TextInputLayout's field delegate), so their
 * behavior is unchanged. Widgets replace their delegate on their own, for
 * example a chip whose close icon gets a listener or a button added to a
 * toggle group, so the wrapper is put back on the view's next layout.
 */
object PCTestID {
  /**
   * Gives [view] the testID ([testID] empty or null removes it): its view
   * tag and its accessibility node's resource-id.
   */
  fun apply(view: View?, testID: String?) {
    view ?: return
    val id = testID?.takeIf { it.isNotEmpty() }
    view.tag = id
    if (id == null) return
    if (view.getTag(R.id.pc_test_id_watched) == null) {
      view.setTag(R.id.pc_test_id_watched, true)
      view.addOnLayoutChangeListener { v, _, _, _, _, _, _, _, _ ->
        if (v.tag is String) wrapDelegate(v)
      }
    }
    wrapDelegate(view)
  }

  /** The resource-id [view]'s accessibility node reports, or null. */
  private fun resourceIdOf(view: View): String? = (view.tag as? String)?.takeIf { it.isNotEmpty() }

  private fun wrapDelegate(view: View) {
    val current = ViewCompat.getAccessibilityDelegate(view)
    if (current is ResourceIdDelegate) return
    ViewCompat.setAccessibilityDelegate(view, ResourceIdDelegate(current))
  }

  /**
   * Forwards everything to [original] (or the default behavior when the view
   * had no delegate), and names the node after the view's testID.
   */
  internal class ResourceIdDelegate(
    private val original: AccessibilityDelegateCompat?
  ) : AccessibilityDelegateCompat() {
    override fun onInitializeAccessibilityNodeInfo(host: View, info: AccessibilityNodeInfoCompat) {
      if (original != null) {
        original.onInitializeAccessibilityNodeInfo(host, info)
      } else {
        super.onInitializeAccessibilityNodeInfo(host, info)
      }
      resourceIdOf(host)?.let { info.viewIdResourceName = it }
    }

    override fun sendAccessibilityEvent(host: View, eventType: Int) {
      if (original != null) original.sendAccessibilityEvent(host, eventType)
      else super.sendAccessibilityEvent(host, eventType)
    }

    override fun sendAccessibilityEventUnchecked(host: View, event: AccessibilityEvent) {
      if (original != null) original.sendAccessibilityEventUnchecked(host, event)
      else super.sendAccessibilityEventUnchecked(host, event)
    }

    override fun dispatchPopulateAccessibilityEvent(host: View, event: AccessibilityEvent): Boolean =
      original?.dispatchPopulateAccessibilityEvent(host, event)
        ?: super.dispatchPopulateAccessibilityEvent(host, event)

    override fun onPopulateAccessibilityEvent(host: View, event: AccessibilityEvent) {
      if (original != null) original.onPopulateAccessibilityEvent(host, event)
      else super.onPopulateAccessibilityEvent(host, event)
    }

    override fun onInitializeAccessibilityEvent(host: View, event: AccessibilityEvent) {
      if (original != null) original.onInitializeAccessibilityEvent(host, event)
      else super.onInitializeAccessibilityEvent(host, event)
    }

    override fun onRequestSendAccessibilityEvent(
      host: ViewGroup,
      child: View,
      event: AccessibilityEvent
    ): Boolean =
      original?.onRequestSendAccessibilityEvent(host, child, event)
        ?: super.onRequestSendAccessibilityEvent(host, child, event)

    override fun getAccessibilityNodeProvider(host: View): AccessibilityNodeProviderCompat? =
      if (original != null) original.getAccessibilityNodeProvider(host)
      else super.getAccessibilityNodeProvider(host)

    override fun performAccessibilityAction(host: View, action: Int, args: Bundle?): Boolean =
      original?.performAccessibilityAction(host, action, args)
        ?: super.performAccessibilityAction(host, action, args)
  }
}
