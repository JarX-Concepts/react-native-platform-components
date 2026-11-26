package com.platformcomponents

import android.text.StaticLayout
import android.text.TextPaint
import android.view.View
import android.widget.EditText
import androidx.core.text.TextDirectionHeuristicsCompat
import com.google.android.material.textfield.TextInputLayout

/** Shared by TextField and SelectionMenu, which both build a Material TextInputLayout. */
internal object PCTextInputSupport {
  /**
   * Lets a label too long for one line wrap, at rest and floated, instead of
   * ending in "…". Call after the layout has been measured at its real width;
   * true when the line limit changed, and the layout has to be measured again.
   *
   * Material cuts the label at hintMaxLines, one line by default. Allowing
   * more changes how it lays out every label, even one that fits a line: a
   * filled box gets other padding, an outlined label's notch another offset.
   * So only a label wider than its room gets more lines, and a field whose
   * label fits looks as it always did.
   *
   * Material draws a right-to-left label on one line whatever the limit
   * (CollapsingTextHelper.shouldDrawMultiline), so it stays at one there:
   * more lines would only make room it doesn't use.
   */
  fun fitHintLines(layout: TextInputLayout, edit: EditText): Boolean {
    val label = if (layout.isHintEnabled) layout.hint else null
    // The room the resting label is laid out in; the floated label is smaller
    val room = edit.measuredWidth - edit.compoundPaddingLeft - edit.compoundPaddingRight
    if (room <= 0) return false
    val wraps = !label.isNullOrEmpty() &&
      !isRtl(layout, label) &&
      edit.paint.measureText(label, 0, label.length) > room
    val lines = if (wraps) Int.MAX_VALUE else 1
    if (wraps && label != null) padRestingLabel(layout, edit, label, room)
    if (layout.hintMaxLines == lines) return false
    layout.hintMaxLines = lines
    return true
  }

  /**
   * Material makes an outlined field's edit text as tall as a resting label
   * on more than one line, without the padding it then lays that label out
   * inside of: the label ran into the box's top and bottom. The padding is
   * added here; Material only ever raises the height.
   */
  private fun padRestingLabel(layout: TextInputLayout, edit: EditText, label: CharSequence, room: Int) {
    if (layout.boxBackgroundMode != TextInputLayout.BOX_BACKGROUND_OUTLINE) return
    val lines = StaticLayout.Builder.obtain(label, 0, label.length, TextPaint(edit.paint), room).build()
    val height = lines.height + edit.compoundPaddingTop + edit.compoundPaddingBottom
    if (edit.minimumHeight < height) edit.minimumHeight = height
  }

  private fun isRtl(layout: TextInputLayout, text: CharSequence): Boolean {
    val heuristic = if (layout.layoutDirection == View.LAYOUT_DIRECTION_RTL) {
      TextDirectionHeuristicsCompat.FIRSTSTRONG_RTL
    } else {
      TextDirectionHeuristicsCompat.FIRSTSTRONG_LTR
    }
    return heuristic.isRtl(text, 0, text.length)
  }
}
