package com.platformcomponents

import android.view.View
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.events.Event
import com.facebook.react.viewmanagers.PCActionSheetManagerDelegate
import com.facebook.react.viewmanagers.PCActionSheetManagerInterface
import com.platformcomponents.PCButtonSupport.stringOr

class PCActionSheetViewManager :
  ViewGroupManager<PCActionSheetView>(),
  PCActionSheetManagerInterface<PCActionSheetView> {

  private val delegate: ViewManagerDelegate<PCActionSheetView> =
    PCActionSheetManagerDelegate(this)

  override fun getName(): String = "PCActionSheet"

  override fun getDelegate(): ViewManagerDelegate<PCActionSheetView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): PCActionSheetView =
    PCActionSheetView(reactContext)

  override fun addEventEmitters(reactContext: ThemedReactContext, view: PCActionSheetView) {
    view.onSelect = { id ->
      UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)?.dispatchEvent(
        SelectEvent(UIManagerHelper.getSurfaceId(view), view.id, id)
      )
    }
    view.onCancel = {
      UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)?.dispatchEvent(
        CancelEvent(UIManagerHelper.getSurfaceId(view), view.id)
      )
    }
  }

  /** Applies an update's props to the sheet on screen, once they are all in. */
  override fun onAfterUpdateTransaction(view: PCActionSheetView) {
    super.onAfterUpdateTransaction(view)
    view.commit()
  }

  // "open" | "closed"
  override fun setVisible(view: PCActionSheetView, value: String?) {
    view.applyVisible(value)
  }

  override fun setTitle(view: PCActionSheetView, value: String?) {
    view.sheetTitle = value ?: ""
  }

  override fun setMessage(view: PCActionSheetView, value: String?) {
    view.message = value ?: ""
  }

  // actions: [{id, title, icon fields, imageColor, destructive, disabled, haptics, testID}]
  override fun setActions(view: PCActionSheetView, value: ReadableArray?) {
    val out = ArrayList<PCActionSheetView.Action>()
    if (value != null) {
      for (i in 0 until value.size()) {
        val m = value.getMap(i) ?: continue
        out.add(
          PCActionSheetView.Action(
            id = m.stringOr("id", ""),
            title = m.stringOr("title", ""),
            icon = PCButtonSupport.parseIcon(m),
            imageColor = m.stringOr("imageColor", ""),
            destructive = m.stringOr("destructive", "false") == "true",
            disabled = m.stringOr("disabled", "false") == "true",
            haptics = m.stringOr("haptics", ""),
            testID = m.stringOr("testID", "")
          )
        )
      }
    }
    view.actions = out
  }

  // iOS only: Material bottom sheets have no cancel row
  override fun setCancelTitle(view: PCActionSheetView, value: String?) {}

  override fun setCancelTestID(view: PCActionSheetView, value: String?) {}

  // "" (none added) | "none" | "selection" | "light" | "medium" | "heavy" | "success" | "warning" | "error"
  override fun setHaptics(view: PCActionSheetView, value: String?) {
    view.haptics = PCHaptics.configure(view, value)
  }

  override fun setMaxFontSizeMultiplier(view: PCActionSheetView, value: Double) {
    view.maxFontSizeMultiplier = value.toFloat()
  }

  // --- ViewGroupManager child management ---
  override fun addView(parent: PCActionSheetView, child: View, index: Int) {
    parent.addView(child, index)
  }

  override fun removeViewAt(parent: PCActionSheetView, index: Int) {
    parent.removeViewAt(index)
  }

  override fun getChildCount(parent: PCActionSheetView): Int = parent.childCount

  override fun getChildAt(parent: PCActionSheetView, index: Int): View? = parent.getChildAt(index)

  // --- Events ---

  private class SelectEvent(
    surfaceId: Int,
    viewTag: Int,
    private val actionId: String
  ) : Event<SelectEvent>(surfaceId, viewTag) {
    // Every pick counts
    override fun canCoalesce(): Boolean = false

    override fun getEventName(): String = "topSelect"

    // Fabric reads the payload from here
    override fun getEventData(): WritableMap = Arguments.createMap().apply {
      putString("actionId", actionId)
    }
  }

  private class CancelEvent(surfaceId: Int, viewTag: Int) : Event<CancelEvent>(surfaceId, viewTag) {
    override fun canCoalesce(): Boolean = false

    override fun getEventName(): String = "topCancel"

    override fun getEventData(): WritableMap = Arguments.createMap()
  }
}
