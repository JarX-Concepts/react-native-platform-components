package com.platformcomponents

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.StateListDrawable
import android.util.TypedValue
import android.view.Menu
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.core.view.MenuItemCompat
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper
import com.facebook.react.views.text.ReactTypefaceUtils
import com.google.android.material.navigation.NavigationBarView
import com.google.android.material.shape.RelativeCornerSize
import com.google.android.material.shape.ShapeAppearanceModel
import com.platformcomponents.PCButtonSupport.doubleOr
import com.platformcomponents.PCButtonSupport.stringOr
import kotlin.math.roundToInt

/**
 * Tabs on a Material navigation bar (NavigationBarView, the base of
 * BottomNavigationView and NavigationRailView): the item model as the specs
 * send it, and building the menu, icons, badges, colors, active indicator,
 * test ids and label fonts.
 */
object PCNavigationBarSupport {

  data class Item(
    val label: String,
    val value: String,
    val disabled: Boolean,
    val icon: PCButtonSupport.Icon,
    val selectedIcon: PCButtonSupport.Icon,
    /** "" = no badge, " " = a dot, anything else is the badge text */
    val badge: String,
    val accessibilityLabel: String,
    val testID: String,
    /** "" | "search": a search tab without an icon gets a search icon */
    val role: String = ""
  )

  /** Label font and font scale cap; empty / 0 = the platform default. */
  data class LabelFont(
    val family: String = "",
    val size: Float = 0f,
    val weight: String = "",
    val style: String = "",
    val maxFontSizeMultiplier: Float = 0f
  )

  /** The active indicator; 0 = the Material default size. */
  data class Indicator(
    val enabled: Boolean = true,
    /** "" | "pill" | "circle" | "rounded" (cornerRadius) */
    val shape: String = "",
    val cornerRadius: Float = 0f,
    val width: Float = 0f,
    val height: Float = 0f
  )

  /** Menu item id of the tab at [index]; 0 means "no id" to the menu. */
  fun itemId(index: Int) = index + 1

  // items: [{label, value, disabled, icon…, selectedIcon…, badge, accessibilityLabel, testID, role}]
  fun parseItems(value: ReadableArray?): List<Item> {
    val out = ArrayList<Item>()
    if (value == null) return out
    for (i in 0 until value.size()) {
      val m = value.getMap(i) ?: continue
      out.add(
        Item(
          label = m.stringOr("label", ""),
          value = m.stringOr("value", ""),
          disabled = m.stringOr("disabled", "enabled") == "disabled",
          icon = m.icon(""),
          selectedIcon = m.icon("selected"),
          badge = m.stringOr("badge", ""),
          accessibilityLabel = m.stringOr("accessibilityLabel", ""),
          testID = m.stringOr("testID", ""),
          role = m.stringOr("role", "")
        )
      )
    }
    return out
  }

  private fun ReadableMap.icon(prefix: String): PCButtonSupport.Icon {
    fun key(name: String) = if (prefix.isEmpty()) name else prefix + name.replaceFirstChar { it.uppercase() }
    val scale = doubleOr(key("iconScale"), 1.0)
    return PCButtonSupport.Icon(
      type = stringOr(key("iconType"), ""),
      name = stringOr(key("iconName"), ""),
      uri = stringOr(key("iconUri"), ""),
      scale = if (scale > 0) scale.toFloat() else 1f,
      tinted = stringOr(key("iconTinted"), "true") != "false"
    )
  }

  fun labelVisibilityMode(value: String): Int = when (value) {
    "labeled" -> NavigationBarView.LABEL_VISIBILITY_LABELED
    "selected" -> NavigationBarView.LABEL_VISIBILITY_SELECTED
    "unlabeled" -> NavigationBarView.LABEL_VISIBILITY_UNLABELED
    else -> NavigationBarView.LABEL_VISIBILITY_AUTO
  }

  /**
   * Icons above the labels ("vertical"), or beside them ("horizontal",
   * Material 3 Expressive), centered in the bar; "auto" is horizontal from
   * 600dp, the medium window width.
   */
  fun applyItemLayout(bar: NavigationBarView, layout: String, widthPx: Int) {
    val horizontal = when (layout) {
      "horizontal" -> true
      "auto" -> widthPx / bar.resources.displayMetrics.density >= 600f
      else -> false
    }
    val iconGravity =
      if (horizontal) NavigationBarView.ITEM_ICON_GRAVITY_START else NavigationBarView.ITEM_ICON_GRAVITY_TOP
    if (bar.itemIconGravity == iconGravity) return
    bar.itemIconGravity = iconGravity
    bar.itemGravity =
      if (horizontal) NavigationBarView.ITEM_GRAVITY_CENTER else NavigationBarView.ITEM_GRAVITY_TOP_CENTER
  }

  /**
   * Adds the tabs to the bar's menu, as many as it takes, with their icons.
   * Icons that load in the background are applied while [isCurrent] holds,
   * then [onIconLoaded] runs.
   */
  fun populateMenu(
    bar: NavigationBarView,
    items: List<Item>,
    isCurrent: () -> Boolean,
    onIconLoaded: () -> Unit
  ) {
    val menu = bar.menu
    val count = minOf(items.size, bar.maxItemCount)
    for (index in 0 until count) {
      val tab = items[index]
      val item = menu.add(Menu.NONE, itemId(index), index, tab.label)
      item.isEnabled = !tab.disabled
      MenuItemCompat.setContentDescription(item, tab.accessibilityLabel.ifEmpty { null })
      loadItemIcon(bar.context, tab, isCurrent) { drawable ->
        item.icon = drawable
        onIconLoaded()
      }
    }
  }

  /** Colors over the theme's, read from the fresh bar for the states left unset. */
  fun applyColors(
    bar: NavigationBarView,
    active: Int?,
    inactive: Int?,
    indicator: Int?,
    ripple: Int?,
    background: Int?
  ) {
    val checked = intArrayOf(android.R.attr.state_checked)
    val disabled = intArrayOf(-android.R.attr.state_enabled)
    if (active != null || inactive != null) {
      fun tint(theme: ColorStateList?): ColorStateList {
        val base = theme ?: ColorStateList.valueOf(0xFF49454F.toInt())
        return ColorStateList(
          arrayOf(disabled, checked, intArrayOf()),
          intArrayOf(
            base.getColorForState(disabled, base.defaultColor),
            active ?: base.getColorForState(checked, base.defaultColor),
            inactive ?: base.defaultColor
          )
        )
      }
      bar.itemIconTintList = tint(bar.itemIconTintList)
      bar.itemTextColor = tint(bar.itemTextColor)
    }
    indicator?.let { bar.itemActiveIndicatorColor = ColorStateList.valueOf(it) }
    ripple?.let { bar.itemRippleColor = ColorStateList.valueOf(it) }
    background?.let { bar.setBackgroundColor(it) }
  }

  /** The active indicator's visibility, size and shape. */
  fun applyIndicator(bar: NavigationBarView, indicator: Indicator) {
    bar.isItemActiveIndicatorEnabled = indicator.enabled
    val density = bar.resources.displayMetrics.density
    fun px(dp: Float) = (dp * density).roundToInt()
    if (indicator.height > 0) {
      bar.itemActiveIndicatorHeight = px(indicator.height)
      bar.itemActiveIndicatorExpandedHeight = px(indicator.height)
    }
    // Horizontal tabs keep an indicator that wraps the icon and label
    when {
      indicator.shape == "circle" -> bar.itemActiveIndicatorWidth = bar.itemActiveIndicatorHeight
      indicator.width > 0 -> bar.itemActiveIndicatorWidth = px(indicator.width)
    }
    val shape = when (indicator.shape) {
      "pill", "circle" -> ShapeAppearanceModel.builder().setAllCornerSizes(RelativeCornerSize(0.5f)).build()
      "rounded" -> ShapeAppearanceModel.builder().setAllCornerSizes(indicator.cornerRadius * density).build()
      else -> null
    }
    shape?.let { bar.itemActiveIndicatorShapeAppearance = it }
  }

  /** Material badges: a number, text, or a dot. */
  fun applyBadges(bar: NavigationBarView, items: List<Item>, background: Int?, text: Int?) {
    val count = minOf(items.size, bar.maxItemCount)
    for (index in 0 until count) {
      val tab = items[index]
      val id = itemId(index)
      if (tab.badge.isEmpty()) {
        bar.removeBadge(id)
        continue
      }
      val badge = bar.getOrCreateBadge(id)
      badge.clearNumber()
      badge.clearText()
      val number = tab.badge.trim().toIntOrNull()
      when {
        tab.badge == " " -> Unit // a dot
        number != null && number >= 0 -> badge.number = number
        else -> badge.text = tab.badge
      }
      background?.let { badge.backgroundColor = it }
      text?.let { badge.badgeTextColor = it }
      badge.isVisible = true
    }
  }

  /**
   * testIDs on the tab views (Detox matches the view tag), and the label font
   * and font scale cap on their labels. Material creates the label views as
   * tabs are added; call again after a layout to style new ones.
   */
  fun applyTestIDsAndFonts(bar: NavigationBarView, items: List<Item>, font: LabelFont) {
    val count = minOf(items.size, bar.maxItemCount)
    for (index in 0 until count) {
      val itemView = bar.findViewById<View>(itemId(index)) ?: continue
      itemView.tag = items[index].testID.ifEmpty { null }
      styleLabels(itemView, font)
    }
  }

  private fun styleLabels(view: View, font: LabelFont) {
    if (view is TextView) {
      if (font.size > 0) view.setTextSize(TypedValue.COMPLEX_UNIT_SP, font.size)
      if (font.family.isNotEmpty() || font.weight.isNotEmpty() || font.style.isNotEmpty()) {
        view.typeface = ReactTypefaceUtils.applyStyles(
          view.typeface,
          ReactTypefaceUtils.parseFontStyle(font.style.ifEmpty { null }),
          ReactTypefaceUtils.parseFontWeight(font.weight.ifEmpty { null }),
          font.family.ifEmpty { null },
          view.context.assets
        )
      }
      PCThemeSupport.capTextSize(view, font.maxFontSizeMultiplier)
    } else if (view is ViewGroup) {
      for (i in 0 until view.childCount) styleLabels(view.getChildAt(i), font)
    }
  }

  /**
   * The tab's icon, and a checked-state drawable with its selected icon when
   * there is one. Drawable names and bundled assets resolve synchronously;
   * other image URIs load in the background.
   */
  private fun loadItemIcon(context: Context, tab: Item, isCurrent: () -> Boolean, apply: (Drawable?) -> Unit) {
    var normal: Drawable? = null
    var selected: Drawable? = null
    var pending = 1 + (if (tab.selectedIcon.isPresent) 1 else 0)
    fun done() {
      pending -= 1
      if (pending > 0 || !isCurrent()) return
      val sel = selected
      apply(
        if (sel == null) normal
        else StateListDrawable().apply {
          addState(intArrayOf(android.R.attr.state_checked), sel)
          normal?.let { addState(intArrayOf(), it) }
        }
      )
    }
    if (tab.role == "search" && !tab.icon.isPresent) {
      normal = ContextCompat.getDrawable(context, R.drawable.pc_ic_search)
      done()
    } else {
      loadIcon(context, tab.icon) { normal = it; done() }
    }
    if (tab.selectedIcon.isPresent) loadIcon(context, tab.selectedIcon) { selected = it; done() }
  }

  private fun loadIcon(context: Context, icon: PCButtonSupport.Icon, onLoaded: (Drawable?) -> Unit) {
    when (icon.type) {
      "drawable" -> onLoaded(ResourceDrawableIdHelper.instance.getResourceDrawable(context, icon.name))
      "image" -> {
        val uri = icon.uri
        if (!uri.contains(':')) {
          onLoaded(ResourceDrawableIdHelper.instance.getResourceDrawable(context, uri))
        } else {
          PCImageLoader.load(context, uri, icon.scale) { bitmap ->
            onLoaded(bitmap?.let { BitmapDrawable(context.resources, it) })
          }
        }
      }
      else -> onLoaded(null)
    }
  }
}
