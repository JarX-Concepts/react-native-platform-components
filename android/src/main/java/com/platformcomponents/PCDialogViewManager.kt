package com.platformcomponents

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.events.Event
import com.facebook.react.viewmanagers.PCDialogManagerDelegate
import com.facebook.react.viewmanagers.PCDialogManagerInterface
import com.platformcomponents.PCButtonSupport.stringOr

class PCDialogViewManager :
  ViewGroupManager<PCDialogView>(),
  PCDialogManagerInterface<PCDialogView> {

  private val delegate: ViewManagerDelegate<PCDialogView> =
    PCDialogManagerDelegate(this)

  override fun getName(): String = "PCDialog"

  override fun getDelegate(): ViewManagerDelegate<PCDialogView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): PCDialogView =
    PCDialogView(reactContext)

  override fun addEventEmitters(reactContext: ThemedReactContext, view: PCDialogView) {
    fun dispatch(event: Event<*>) {
      UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)?.dispatchEvent(event)
    }
    view.onSelect = { id ->
      dispatch(DialogEvent(UIManagerHelper.getSurfaceId(view), view.id, "topSelect") {
        putString("actionId", id)
      })
    }
    view.onCancel = {
      dispatch(DialogEvent(UIManagerHelper.getSurfaceId(view), view.id, "topCancel"))
    }
    view.onShow = {
      dispatch(DialogEvent(UIManagerHelper.getSurfaceId(view), view.id, "topShow"))
    }
    view.onDismiss = {
      dispatch(DialogEvent(UIManagerHelper.getSurfaceId(view), view.id, "topDismiss"))
    }
    view.onPresentFailed = { reason ->
      dispatch(DialogEvent(UIManagerHelper.getSurfaceId(view), view.id, "topPresentFailed") {
        putString("reason", reason)
      })
    }
  }

  // "open" | "closed"
  override fun setVisible(view: PCDialogView, value: String?) {
    view.applyVisible(value)
  }

  override fun setTitle(view: PCDialogView, value: String?) {
    view.dialogTitle = value ?: ""
  }

  override fun setMessage(view: PCDialogView, value: String?) {
    view.message = value ?: ""
  }

  // actions: [{id, title, role, preferred, disabled, haptics, testID}]
  override fun setActions(view: PCDialogView, value: ReadableArray?) {
    val out = ArrayList<PCDialogView.Action>()
    if (value != null) {
      for (i in 0 until value.size()) {
        val m = value.getMap(i) ?: continue
        out.add(
          PCDialogView.Action(
            id = m.stringOr("id", ""),
            title = m.stringOr("title", ""),
            role = m.stringOr("role", "default"),
            preferred = m.stringOr("preferred", "false") == "true",
            disabled = m.stringOr("disabled", "false") == "true",
            haptics = m.stringOr("haptics", ""),
            testID = m.stringOr("testID", "")
          )
        )
      }
    }
    view.actions = out
  }

  // "true" | "false"
  override fun setDismissable(view: PCDialogView, value: String?) {
    view.dismissable = value != "false"
  }

  // "" (none added) | "none" | "selection" | "light" | "medium" | "heavy" | "success" | "warning" | "error"
  override fun setHaptics(view: PCDialogView, value: String?) {
    view.haptics = PCHaptics.configure(view, value)
  }

  override fun setMaxFontSizeMultiplier(view: PCDialogView, value: Double) {
    view.maxFontSizeMultiplier = value.toFloat()
  }

  // --- Events ---

  private class DialogEvent(
    surfaceId: Int,
    viewTag: Int,
    private val name: String,
    private val payload: WritableMap.() -> Unit = {}
  ) : Event<DialogEvent>(surfaceId, viewTag) {
    // Every event counts
    override fun canCoalesce(): Boolean = false

    override fun getEventName(): String = name

    // Fabric reads the payload from here
    override fun getEventData(): WritableMap = Arguments.createMap().apply(payload)
  }
}
