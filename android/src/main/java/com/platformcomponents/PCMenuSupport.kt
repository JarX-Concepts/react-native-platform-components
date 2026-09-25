package com.platformcomponents

import android.content.Context
import android.graphics.Rect
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.DrawableWrapper
import android.text.SpannableString
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.util.Log
import android.util.TypedValue
import android.view.Menu
import android.view.MenuItem
import androidx.appcompat.R as AppCompatR
import androidx.core.content.ContextCompat
import androidx.core.graphics.drawable.DrawableCompat
import androidx.core.view.MenuCompat
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper
import com.platformcomponents.PCButtonSupport.doubleOr
import com.platformcomponents.PCButtonSupport.stringOr
import kotlin.math.roundToInt

/**
 * Builds Android menus from flattened menu items (src/menuItems.ts): inline
 * sections become menu groups with dividers, and items get submenus, icons
 * (drawables and React Native image sources), the destructive color, the
 * enabled state and a check mark. Shared by the components that show a
 * PopupMenu.
 */
object PCMenuSupport {
  private const val TAG = "PCMenuSupport"

  // Material 3 baseline error color, used when the theme has no colorError.
  private const val FALLBACK_ERROR_COLOR = 0xFFB3261E.toInt()

  // Material menu and list icons are 24dp
  private const val ICON_SIZE_DP = 24

  data class Item(
    /** Position in the flattened list; also the MenuItem id */
    val index: Int,
    val id: String,
    val title: String,
    val subtitle: String,
    /** Index of the parent submenu or section; -1 at the top level */
    val parent: Int,
    /** "action" | "menu" | "section" */
    val kind: String,
    val icon: PCButtonSupport.Icon,
    val imageColor: String,
    val destructive: Boolean,
    val disabled: Boolean,
    /** iOS only; Android popups close on every press */
    val keepsMenuPresented: Boolean,
    /** "" | "off" | "on" | "mixed" */
    val state: String
  ) {
    val isAction: Boolean get() = kind != "menu" && kind != "section"
  }

  /** Reads the flattened items from the `actions` prop. */
  fun parseItems(array: ReadableArray?): List<Item> {
    if (array == null) return emptyList()
    val out = ArrayList<Item>(array.size())
    for (i in 0 until array.size()) {
      val map = array.getMap(i) ?: continue
      out.add(
        Item(
          index = out.size,
          id = map.stringOr("id", ""),
          title = map.stringOr("title", ""),
          subtitle = map.stringOr("subtitle", ""),
          parent = map.doubleOr("parent", -1.0).toInt(),
          kind = map.stringOr("kind", "action"),
          icon = PCButtonSupport.parseIcon(map),
          imageColor = map.stringOr("imageColor", ""),
          destructive = map.stringOr("destructive", "false") == "true",
          disabled = map.stringOr("disabled", "false") == "true",
          keepsMenuPresented = map.stringOr("keepsMenuPresented", "false") == "true",
          state = map.stringOr("state", "")
        )
      )
    }
    return out
  }

  /**
   * Adds [items] to [menu]. Each MenuItem's id is its item's index, so
   * [itemFor] finds the item behind a click. Image icons that load in the
   * background are set when they arrive, while [isCurrent] holds. Returns
   * whether any item has an icon (for `PopupMenu.setForceShowIcon`).
   */
  fun populate(
    context: Context,
    menu: Menu,
    items: List<Item>,
    isCurrent: () -> Boolean = { true }
  ): Boolean {
    val children = items.groupBy { it.parent }
    var nextGroupId = 1
    var hasIcons = false

    fun add(target: Menu, parent: Int) {
      val list = children[parent] ?: return
      // Dividers are drawn where the group id changes: each section gets its
      // own group, and so does each run of items between sections.
      var groupId = nextGroupId++
      var order = 0
      var sectionsInMenu = false

      fun addItem(item: Item, group: Int) {
        when (item.kind) {
          "menu" -> {
            if (children[item.index].isNullOrEmpty()) return
            val subMenu = target.addSubMenu(group, item.index, order++, item.title)
            subMenu.item.isEnabled = !item.disabled
            if (applyIcon(context, subMenu.item, item, isCurrent)) hasIcons = true
            add(subMenu, item.index)
          }
          else -> {
            val menuItem = target.add(group, item.index, order++, title(context, item))
            menuItem.isEnabled = !item.disabled
            if (applyIcon(context, menuItem, item, isCurrent)) hasIcons = true
            // Android has no mixed state: "mixed" shows checked
            if (item.state == "on" || item.state == "mixed") {
              menuItem.isCheckable = true
              menuItem.isChecked = true
            }
          }
        }
      }

      // A section's items; sections nested in it add their items to the same group
      fun sectionItems(section: Item): List<Item> =
        children[section.index].orEmpty().flatMap {
          if (it.kind == "section") sectionItems(it) else listOf(it)
        }

      for (item in list) {
        if (item.kind == "section") {
          val sectionItems = sectionItems(item)
          if (sectionItems.isEmpty()) continue
          sectionsInMenu = true
          val sectionGroup = nextGroupId++
          sectionItems.forEach { addItem(it, sectionGroup) }
          // Items after the section start a new group
          groupId = nextGroupId++
        } else {
          addItem(item, groupId)
        }
      }

      if (sectionsInMenu) MenuCompat.setGroupDividerEnabled(target, true)
    }

    add(menu, -1)
    return hasIcons
  }

  /** The item behind a clicked MenuItem. */
  fun itemFor(menuItem: MenuItem, items: List<Item>): Item? = items.getOrNull(menuItem.itemId)

  /** Destructive titles are drawn in the theme's error color. */
  private fun title(context: Context, item: Item): CharSequence {
    if (!item.destructive) return item.title
    return SpannableString(item.title).apply {
      setSpan(ForegroundColorSpan(errorColor(context)), 0, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    }
  }

  /**
   * Sets the item's icon; returns whether it has one. An explicit imageColor
   * tints it; destructive icons otherwise take the error color.
   */
  private fun applyIcon(
    context: Context,
    menuItem: MenuItem,
    item: Item,
    isCurrent: () -> Boolean
  ): Boolean {
    if (!item.icon.isPresent) return false
    loadIcon(context, item.icon) { drawable ->
      if (drawable == null || !isCurrent()) return@loadIcon
      val color = when {
        item.imageColor.isNotEmpty() -> ColorParser.parse(item.imageColor)
        item.destructive -> errorColor(context)
        else -> null
      }
      menuItem.icon = if (color != null) tint(drawable, color) else drawable
    }
    return true
  }

  /**
   * Resolves an icon to a drawable. Drawable names and release-bundled assets
   * (drawable resources) resolve right away; other image URIs load in the
   * background and arrive on the main thread. Image sources sit in a 24dp
   * box, and those drawn as templates take the theme's icon color
   * (`?attr/colorControlNormal`, as Material icons do); drawables keep their
   * own size and tint.
   */
  fun loadIcon(context: Context, icon: PCButtonSupport.Icon, onLoaded: (Drawable?) -> Unit) {
    fun imageIcon(drawable: Drawable): Drawable {
      val size = (ICON_SIZE_DP * context.resources.displayMetrics.density).roundToInt()
      val color = if (icon.tinted) themeColor(context, AppCompatR.attr.colorControlNormal) else null
      return IconBox(if (color != null) tint(drawable, color) else drawable, size)
    }
    when (icon.type) {
      "drawable" -> onLoaded(drawableByName(context, icon.name))
      "image" -> {
        val uri = icon.uri
        if (!uri.contains(':')) {
          onLoaded(ResourceDrawableIdHelper.instance.getResourceDrawable(context, uri)?.let(::imageIcon))
        } else {
          PCImageLoader.load(context, uri, icon.scale) { bitmap ->
            onLoaded(bitmap?.let { imageIcon(BitmapDrawable(context.resources, it)) })
          }
        }
      }
      else -> onLoaded(null)
    }
  }

  /**
   * Keeps an image source in the 24dp box of Material menu icons, centered
   * and scaled down when larger, so its row lines up with the drawable icons.
   */
  private class IconBox(drawable: Drawable, private val size: Int) : DrawableWrapper(drawable) {
    override fun getIntrinsicWidth(): Int = size
    override fun getIntrinsicHeight(): Int = size

    override fun onBoundsChange(bounds: Rect) {
      val inner = drawable ?: return
      val w = inner.intrinsicWidth.takeIf { it > 0 } ?: bounds.width()
      val h = inner.intrinsicHeight.takeIf { it > 0 } ?: bounds.height()
      val scale = minOf(1f, bounds.width().toFloat() / w, bounds.height().toFloat() / h)
      val width = (w * scale).roundToInt()
      val height = (h * scale).roundToInt()
      val left = bounds.left + (bounds.width() - width) / 2
      val top = bounds.top + (bounds.height() - height) / 2
      inner.setBounds(left, top, left + width, top + height)
    }
  }

  private fun tint(drawable: Drawable, color: Int): Drawable {
    val wrapped = DrawableCompat.wrap(drawable.mutate())
    DrawableCompat.setTint(wrapped, color)
    return wrapped
  }

  /** A drawable resource by name, also trying the `ic_` prefix. */
  private fun drawableByName(context: Context, name: String): Drawable? {
    if (name.isEmpty()) return null
    for (candidate in listOf(name, "ic_$name")) {
      val id = context.resources.getIdentifier(candidate, "drawable", context.packageName)
      if (id != 0) return ContextCompat.getDrawable(context, id)
    }
    Log.d(TAG, "Drawable not found: $name")
    return null
  }

  /** The theme's ?attr/colorError, falling back to the Material 3 error red. */
  fun errorColor(context: Context): Int =
    themeColor(context, AppCompatR.attr.colorError) ?: FALLBACK_ERROR_COLOR

  fun themeColor(context: Context, attr: Int): Int? {
    val value = TypedValue()
    if (!context.theme.resolveAttribute(attr, value, true)) return null
    return if (value.resourceId != 0) {
      ContextCompat.getColor(context, value.resourceId)
    } else {
      value.data
    }
  }
}
