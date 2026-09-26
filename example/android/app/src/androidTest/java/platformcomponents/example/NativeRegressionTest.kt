package platformcomponents.example

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Rect
import android.graphics.drawable.Drawable
import android.os.SystemClock
import android.util.Base64
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.widget.FrameLayout
import android.widget.DatePicker
import android.widget.EditText
import android.widget.ImageView
import android.widget.ListAdapter
import android.widget.Filterable
import android.widget.NumberPicker
import android.widget.Spinner
import android.widget.TextView
import com.google.android.material.button.MaterialButton
import com.google.android.material.button.MaterialButtonToggleGroup
import com.facebook.react.bridge.ReadableNativeMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.mapbuffer.ReadableMapBuffer
import com.facebook.react.uimanager.StateWrapper
import androidx.test.espresso.Espresso.onData
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.assertion.ViewAssertions.doesNotExist
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withText
import androidx.test.espresso.matcher.ViewMatchers.withHint
import androidx.test.espresso.matcher.RootMatchers.isPlatformPopup
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.rule.ActivityTestRule
import com.google.android.material.datepicker.MaterialDatePicker
import com.google.android.material.navigation.NavigationBarView
import com.google.android.material.textfield.MaterialAutoCompleteTextView
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.timepicker.MaterialTimePicker
import com.platformcomponents.PCDatePickerView
import com.platformcomponents.PCButtonGroupView
import com.platformcomponents.PCButtonSupport
import com.platformcomponents.PCContextMenuView
import com.platformcomponents.PCImageLoader
import com.platformcomponents.PCNavigationBarSupport
import com.platformcomponents.PCNavigationRailView
import com.platformcomponents.PCSegmentedControlView
import com.platformcomponents.PCSelectionMenuView
import com.platformcomponents.PCTabBarView
import com.platformcomponents.PCTextFieldView
import java.io.ByteArrayOutputStream
import java.net.ServerSocket
import java.util.Collections
import org.json.JSONObject
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.hamcrest.Matchers.equalTo

/** Native regressions that JS host-component mocks cannot exercise. */
@RunWith(AndroidJUnit4::class)
class NativeRegressionTest {
  @get:Rule
  val activityRule = ActivityTestRule(NativeTestActivity::class.java, false, true)

  private val instrumentation get() = InstrumentationRegistry.getInstrumentation()
  private val activity get() = activityRule.activity
  private lateinit var host: FrameLayout
  private var closed = 0

  @Before
  fun attachHost() {
    onMain {
      host = FrameLayout(activity)
      ViewCompat.setOnApplyWindowInsetsListener(host) { view, insets ->
        val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
        view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
        insets
      }
      activity.addContentView(host, ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      ))
      ViewCompat.requestApplyInsets(host)
    }
  }

  @After
  fun detachHost() {
    onMain { (host.parent as? ViewGroup)?.removeView(host) }
    settle()
  }

  @Test
  fun systemPickerClosesWhenVisibleBecomesFalse() {
    val picker = openPicker("system")
    onView(withText(TITLE)).check(matches(isDisplayed()))
    onMain { picker.applyVisible("closed") }
    settle()
    onView(withText(TITLE)).check(doesNotExist())
    assertEquals(1, closed)

    onMain { picker.applyVisible("open") }
    settle()
    onView(withText(TITLE)).check(matches(isDisplayed()))
    onMain { picker.applyVisible("closed") }
    settle()
    onView(withText(TITLE)).check(doesNotExist())
    assertEquals(2, closed)
  }

  @Test
  fun materialPickerClosesWhenVisibleBecomesFalse() {
    val picker = openPicker("m3")
    val dialog = materialDatePicker().dialog!!
    assertTrue(dialog.isShowing)
    onMain { picker.applyVisible("closed") }
    settle()
    assertFalse(dialog.isShowing)
    assertEquals(1, closed)
  }

  @Test
  fun detachingPickerDismissesItsDialogWithoutEmittingToAnUnmountedView() {
    val picker = openPicker("m3")
    val dialog = materialDatePicker().dialog!!
    onMain { host.removeView(picker) }
    settle()
    assertFalse(dialog.isShowing)
    assertEquals(0, closed)
  }

  @Test
  fun materialDateAndTimeStaysOpenBetweenStepsAndClosesOnce() {
    val picker = openPicker("m3", "dateAndTime")
    val datePicker = materialDatePicker("PCDatePicker_M3_DATE_THEN_TIME")
    onMain {
      datePicker.dialog!!.findViewById<View>(com.google.android.material.R.id.confirm_button).performClick()
    }
    settle()
    val timePicker = activity.supportFragmentManager
      .findFragmentByTag("PCDatePicker_M3_TIME") as? MaterialTimePicker
    assertNotNull(timePicker)
    val dialog = timePicker!!.dialog!!
    assertTrue(dialog.isShowing)
    assertEquals("Next must not emit onClosed", 0, closed)

    onMain { picker.applyVisible("closed") }
    settle()
    assertFalse(dialog.isShowing)
    assertEquals(1, closed)
  }

  @Test
  fun inlineDatePickerUsesSpinnersAndSurvivesRepeatedDateAndConstraintLayouts() {
    onMain {
      val picker = PCDatePickerView(activity)
      picker.stateWrapper = object : StateWrapper {
        override val stateDataMapBuffer: ReadableMapBuffer? = null
        override val stateData: ReadableNativeMap? = null
        override fun updateState(map: WritableMap) = Unit
        override fun destroyState() = Unit
      }
      picker.applyPresentation("inline")
      host.addView(picker)
      // Fabric first lays an intrinsic-height view out at zero height, then
      // applies the size reported through the native state wrapper.
      picker.measure(
        View.MeasureSpec.makeMeasureSpec(800, View.MeasureSpec.EXACTLY),
        View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.EXACTLY)
      )
      picker.layout(0, 0, 800, 0)
      layoutAndCheckDateWheels(picker)
      repeat(12) { month ->
        picker.applyDateMs(1_735_689_600_000L + month * 2_592_000_000L)
        picker.applyMinDateMs(1_704_067_200_000L)
        picker.applyMaxDateMs(1_767_225_600_000L)
        layoutAndCheckDateWheels(picker)
      }
    }
  }

  private fun layoutAndCheckDateWheels(picker: PCDatePickerView) {
    picker.measure(
      View.MeasureSpec.makeMeasureSpec(800, View.MeasureSpec.EXACTLY),
      View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED)
    )
    // Yoga applies the intrinsic result as an exact outer frame.
    picker.measure(
      View.MeasureSpec.makeMeasureSpec(800, View.MeasureSpec.EXACTLY),
      View.MeasureSpec.makeMeasureSpec(picker.measuredHeight, View.MeasureSpec.EXACTLY)
    )
    picker.layout(0, 0, picker.measuredWidth, picker.measuredHeight)
    // TextView brings its single-line text into view during the pre-draw phase.
    // A software render must run that phase too, just as ViewRootImpl does.
    picker.viewTreeObserver.dispatchOnPreDraw()
    val wheels = descendants(descendant<DatePicker>(picker)).filterIsInstance<NumberPicker>().toList()
    assertEquals("Embedded date picker must have month, day and year wheels", 3, wheels.size)
    for (wheel in wheels) {
      val input = descendant<EditText>(wheel)
      val description = "Selected wheel value ${wheel.value}, text='${input.text}', bounds=${input.width}×${input.height}, textLayout=${input.layout?.width}×${input.layout?.height}, scroll=${input.scrollX},${input.scrollY}"
      assertTrue("$description must have text", input.text.isNotEmpty())
      assertEquals("$description must be visible", View.VISIBLE, input.visibility)
      assertTrue("$description must have a visible text area", input.width > 0 && input.height > 0 && input.alpha > 0)
      val bitmap = Bitmap.createBitmap(input.width, input.height, Bitmap.Config.ARGB_8888)
      try {
        val canvas = Canvas(bitmap)
        canvas.translate(-input.scrollX.toFloat(), -input.scrollY.toFloat())
        input.draw(canvas)
        val pixels = IntArray(bitmap.width * bitmap.height)
        bitmap.getPixels(pixels, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)
        assertTrue("$description must draw its selected text", pixels.any { Color.alpha(it) > 0 })
      } finally {
        bitmap.recycle()
      }
    }
  }

  @Test
  fun textFieldSubmitsFilteredTextAfterInitialValueCommandsAndRebuilds() {
    onMain {
      val field = PCTextFieldView(activity)
      host.addView(field)
      var submitted = ""
      field.onSubmit = { submitted = it }
      field.applyMaxLength(3)
      field.applyInitialText("abcdef")
      inputIn(field).onEditorAction(EditorInfo.IME_ACTION_DONE)
      assertEquals("abc", submitted)

      field.setTextFromJS(0, "uvwxyz")
      inputIn(field).onEditorAction(EditorInfo.IME_ACTION_DONE)
      assertEquals("uvw", submitted)

      field.applyMaxLength(2)
      field.applyVariant("filled")
      inputIn(field).onEditorAction(EditorInfo.IME_ACTION_DONE)
      assertEquals("uv", submitted)
    }
  }

  @Test
  fun segmentedControlRestoresASelectionTheParentRejects() {
    lateinit var field: PCSegmentedControlView
    var reported = ""
    onMain {
      field = PCSegmentedControlView(activity)
      field.applySegments(listOf(segment("A"), segment("B")))
      field.applySelectedValue("A")
      field.onSelect = { _, value -> reported = value }
      host.addView(field)
      val group = field.getChildAt(0) as MaterialButtonToggleGroup
      (group.getChildAt(1) as MaterialButton).performClick()
    }
    settle()
    onMain {
      val group = field.getChildAt(0) as MaterialButtonToggleGroup
      assertEquals("B", reported)
      assertTrue((group.getChildAt(0) as MaterialButton).isChecked)
      assertFalse((group.getChildAt(1) as MaterialButton).isChecked)
    }
  }

  @Test
  fun buttonGroupRestoresRejectedSelectionAndAllowsControlledEmptySelection() {
    lateinit var field: PCButtonGroupView
    var reported: List<String> = emptyList()
    onMain {
      field = PCButtonGroupView(activity)
      field.applySelection("single")
      field.applySelectionRequired(true)
      field.applyItems(listOf("A", "B").map {
        PCButtonGroupView.Item(it, it, false, PCButtonSupport.NO_ICON, "")
      })
      field.applySelectedValues(listOf("A"))
      field.onSelectionChange = { reported = it }
      host.addView(field)
      val group = field.getChildAt(0) as MaterialButtonToggleGroup
      (group.getChildAt(1) as MaterialButton).performClick()
    }
    settle()
    onMain {
      val group = field.getChildAt(0) as MaterialButtonToggleGroup
      assertEquals(listOf("B"), reported)
      assertTrue((group.getChildAt(0) as MaterialButton).isChecked)
      assertFalse((group.getChildAt(1) as MaterialButton).isChecked)
      field.applySelectedValues(emptyList())
      assertTrue(group.checkedButtonIds.isEmpty())
    }
  }

  @Test
  fun selectionMenuRestoresRejectedSystemSelection() {
    lateinit var field: PCSelectionMenuView
    var reported = ""
    onMain {
      field = PCSelectionMenuView(activity)
      field.applyAnchorMode("inline")
      field.applyOptions(listOf(PCSelectionMenuView.Option("A", "A"), PCSelectionMenuView.Option("B", "B")))
      field.applySelectedData("A")
      field.onSelect = { _, _, data -> reported = data }
      host.addView(field)
    }
    settle()
    onMain { descendant<Spinner>(field).setSelection(1) }
    settle()
    onMain {
      assertEquals("B", reported)
      assertEquals(0, descendant<Spinner>(field).selectedItemPosition)
    }
  }

  @Test
  fun systemSelectionMenuShowsPlaceholderAndCanSelectTheFirstOption() {
    lateinit var field: PCSelectionMenuView
    val reported = mutableListOf<Pair<Int, String>>()
    onMain {
      field = PCSelectionMenuView(activity)
      field.applyAnchorMode("inline")
      field.applyOptions(listOf(PCSelectionMenuView.Option("A", "A"), PCSelectionMenuView.Option("B", "B")))
      field.applyPlaceholder("Choose an option")
      field.applySelectedData(null)
      field.onSelect = { index, _, data ->
        reported.add(index to data)
        field.applySelectedData(data)
      }
      host.addView(field)
    }
    settle()
    onMain {
      val spinner = descendant<Spinner>(field)
      val label = spinner.adapter.getView(spinner.selectedItemPosition, null, spinner) as TextView
      assertEquals("", label.text.toString())
      assertEquals("Choose an option", label.hint.toString())
      assertTrue("Initial null selection must not emit an option", reported.isEmpty())
      assertFalse((spinner.adapter as ListAdapter).isEnabled(0))
      assertEquals("Choose an option", (spinner.adapter.getDropDownView(0, null, spinner) as TextView).text.toString())
    }
    onView(withHint("Choose an option")).perform(click())
    onData(equalTo("A")).inRoot(isPlatformPopup()).perform(click())
    waitForMainCondition("Choosing the first option must report its public index and data") {
      reported == listOf(0 to "A")
    }
    waitForViewToDisappear("B")
    settle()
    onMain {
      assertEquals(listOf(0 to "A"), reported)
      val spinner = descendant<Spinner>(field)
      assertEquals("A selected menu must contain only its real options", 2, spinner.adapter.count)
      assertEquals("A", (spinner.adapter.getView(spinner.selectedItemPosition, null, spinner) as TextView).text.toString())
    }
    onView(withText("A")).perform(click())
    // Re-selecting the current value also dismisses the native popup, without
    // a second event or accidentally hitting the label underneath it.
    onData(equalTo("A")).inRoot(isPlatformPopup()).perform(click())
    waitForViewToDisappear("B")
    onMain {
      field.applySelectedData(null)
      field.applyPlaceholder("Choose again")
    }
    settle()
    onMain {
      val spinner = descendant<Spinner>(field)
      assertEquals(0, spinner.selectedItemPosition)
      assertEquals("Choose again", (spinner.adapter.getView(0, null, spinner) as TextView).hint.toString())
      assertEquals("Resetting to null must not emit a selection", listOf(0 to "A"), reported)
      field.applyOptions(emptyList())
    }
    settle()
    onMain {
      val spinner = descendant<Spinner>(field)
      assertEquals("Choose again", (spinner.adapter.getView(0, null, spinner) as TextView).hint.toString())
      assertEquals(listOf(0 to "A"), reported)
    }
  }

  @Test
  fun contextMenuLongPressCancelsChildUsingOriginalTouchAndUptime() {
    val cancelled = CountDownLatch(1)
    var cancelEvent: MotionEvent? = null
    val downTime = SystemClock.uptimeMillis()
    onMain {
      val menu = PCContextMenuView(activity)
      val child = View(activity).apply {
        setOnTouchListener { _, event ->
          if (event.action == MotionEvent.ACTION_CANCEL) {
            cancelEvent = MotionEvent.obtain(event)
            cancelled.countDown()
          }
          true
        }
      }
      menu.addView(child)
      host.addView(menu)
      menu.layout(0, 0, 100, 100)
      child.layout(0, 0, 100, 100)
      val down = MotionEvent.obtain(downTime, downTime, MotionEvent.ACTION_DOWN, 12f, 18f, 0)
      menu.dispatchTouchEvent(down)
      // The dispatcher owns and recycles the event after returning. Mutating
      // it here makes any delayed read of that caller-owned object observable.
      down.setLocation(80f, 90f)
      down.recycle()
    }
    assertTrue("Long press must cancel the child's touch", cancelled.await(ViewConfiguration.getLongPressTimeout().toLong() + 2000, TimeUnit.MILLISECONDS))
    val event = cancelEvent!!
    try {
      assertEquals(downTime, event.downTime)
      assertEquals(12f, event.x, 0f)
      assertEquals(18f, event.y, 0f)
      assertTrue("MotionEvent timestamps use uptime", event.eventTime in downTime..SystemClock.uptimeMillis())
    } finally {
      event.recycle()
    }
  }

  @Test
  fun textFieldLoadsBothAccessoryImagesAfterARebuild() {
    val leading = imageIcon(Color.MAGENTA, preload = false)
    val trailing = imageIcon(Color.CYAN, preload = false)
    lateinit var field: PCTextFieldView
    onMain {
      field = PCTextFieldView(activity)
      field.applyLeadingIcon(leading)
      field.applyTrailingIcon(trailing)
      host.addView(field)
      field.applyVariant("filled")
    }
    waitForMainCondition("Both accessory images must load after rebuilding the field") {
      field.findViewById<ImageView>(com.google.android.material.R.id.text_input_start_icon)?.drawable != null &&
        field.findViewById<ImageView>(com.google.android.material.R.id.text_input_end_icon)?.drawable != null
    }
    onMain {
      assertDrawableColor(field.findViewById<ImageView>(com.google.android.material.R.id.text_input_start_icon).drawable, Color.MAGENTA)
      assertDrawableColor(field.findViewById<ImageView>(com.google.android.material.R.id.text_input_end_icon).drawable, Color.CYAN)
    }
  }

  @Test
  fun textFieldKeepsMixedIconColorsAndRestoresTintAfterPropUpdates() {
    val leading = imageIcon(Color.RED)
    val trailing = imageIcon(Color.GREEN)
    onMain {
      for (material in listOf("system", "m3")) {
        val field = PCTextFieldView(activity)
        field.applyMaterial(material)
        field.applyLeadingIcon(leading.copy(tinted = true))
        field.applyTrailingIcon(trailing)
        field.applyInitialText("Keep this selection")
        host.addView(field)
        val originalInput = inputIn(field)
        originalInput.requestFocus()
        originalInput.setSelection(2, 7)
        fun icon(start: Boolean): Drawable? =
          if (material == "system") inputIn(field).compoundDrawablesRelative[if (start) 0 else 2]
          else field.findViewById<ImageView>(
            if (start) com.google.android.material.R.id.text_input_start_icon
            else com.google.android.material.R.id.text_input_end_icon
          ).drawable

        val originalTint = drawableColor(icon(true))
        assertTrue("$material leading icon must use its template tint", originalTint != Color.RED)
        assertDrawableColor(icon(false), Color.GREEN)
        field.applyLeadingIcon(leading)
        assertDrawableColor(icon(true), Color.RED)
        field.applyTrailingIcon(trailing.copy(tinted = true))
        assertDrawableColor(icon(true), Color.RED)
        assertTrue("$material trailing icon must restore its template tint", drawableColor(icon(false)) != Color.GREEN)
        field.applyLeadingIcon(leading.copy(tinted = true))
        assertDrawableColor(icon(true), originalTint)
        field.applyTrailingIcon(trailing)
        assertDrawableColor(icon(false), Color.GREEN)
        assertDrawableColor(icon(true), originalTint)
        assertSame("Icon updates must preserve the active input", originalInput, inputIn(field))
        assertTrue(originalInput.hasFocus())
        assertEquals(2, originalInput.selectionStart)
        assertEquals(7, originalInput.selectionEnd)
      }
    }
  }

  @Test
  fun selectionMenuRestoresRejectedMaterialSelection() {
    lateinit var field: PCSelectionMenuView
    var reported = ""
    onMain {
      field = PCSelectionMenuView(activity)
      field.applyAnchorMode("inline")
      field.applyAndroidMaterial("m3")
      field.applyOptions(listOf(PCSelectionMenuView.Option("A", "A"), PCSelectionMenuView.Option("B", "B")))
      field.applySelectedData("A")
      field.onSelect = { _, _, data -> reported = data }
      host.addView(field)
    }
    settle()
    onMain {
      val input = descendant<MaterialAutoCompleteTextView>(field)
      // AutoCompleteTextView fills the label before notifying its listener.
      input.setText("B", false)
      input.onItemClickListener!!.onItemClick(null, null, 1, 1L)
    }
    settle()
    onMain {
      assertEquals("B", reported)
      assertEquals("A", descendant<MaterialAutoCompleteTextView>(field).text.toString())
    }
  }

  @Test
  fun disabledSystemOptionsRemainVisibleAndCannotChangeSelection() {
    lateinit var field: PCSelectionMenuView
    val reported = mutableListOf<Int>()
    val options = listOf(
      PCSelectionMenuView.Option("First available", "a"),
      PCSelectionMenuView.Option("Unavailable", "b", disabled = true),
      PCSelectionMenuView.Option("Last available", "c")
    )
    onMain {
      field = PCSelectionMenuView(activity)
      field.applyAnchorMode("inline")
      field.applyOptions(options)
      field.applySelectedData("a")
      field.onSelect = { index, _, _ -> reported.add(index) }
      host.addView(field)
    }
    settle()
    onMain {
      val spinner = descendant<Spinner>(field)
      val adapter = spinner.adapter as ListAdapter
      assertEquals(3, adapter.count)
      assertFalse(adapter.areAllItemsEnabled())
      assertFalse(adapter.isEnabled(1))
      assertTrue(adapter.isEnabled(2))
      val disabledRow = spinner.adapter.getDropDownView(1, null, spinner)
      assertFalse(disabledRow.isEnabled)
      assertTrue(spinner.adapter.getDropDownView(2, disabledRow, spinner).isEnabled)
      spinner.setSelection(1)
    }
    settle()
    onMain {
      assertTrue(reported.isEmpty())
      assertEquals(0, descendant<Spinner>(field).selectedItemPosition)
      field.applyOptions(options.map { it.copy(disabled = false) })
    }
    settle()
    onMain { descendant<Spinner>(field).setSelection(1) }
    settle()
    onMain { assertEquals(listOf(1), reported) }
    // A controlled parent rejected the first pick. A later pick of that same
    // option must be reported again, once the duplicate-callback guard resets.
    onMain { descendant<Spinner>(field).setSelection(1) }
    settle()
    onMain { assertEquals(listOf(1, 1), reported) }
  }

  @Test
  fun disabledModalOptionsIgnoreTouchesAndCanBeEnabledAgain() {
    lateinit var field: PCSelectionMenuView
    val reported = mutableListOf<Int>()
    val options = listOf(
      PCSelectionMenuView.Option("Modal available", "a"),
      PCSelectionMenuView.Option("Modal unavailable", "b", disabled = true)
    )
    onMain {
      field = PCSelectionMenuView(activity)
      field.applyAnchorMode("headless")
      field.applyOptions(options)
      field.applySelectedData("a")
      field.onSelect = { index, _, _ -> reported.add(index) }
      host.addView(field, FrameLayout.LayoutParams(500, 100))
      field.applyVisible("open")
    }
    settle()
    onView(withText("Modal unavailable")).check { title, error ->
      if (error != null) throw error
      // PopupMenu disables its action row; its nested title keeps its own
      // enabled flag, so checking the title alone does not test the action.
      val row = generateSequence(title.parent as? View) { it.parent as? View }
        .first { it.javaClass.name == "androidx.appcompat.view.menu.ListMenuItemView" }
      assertFalse(row.isEnabled)
    }
    onView(withText("Modal unavailable")).perform(click())
    settle()
    onMain { assertTrue(reported.isEmpty()) }
    onView(withText("Modal available")).check(matches(isDisplayed()))
    onView(withText("Modal available")).perform(click())
    settle()
    onMain {
      assertEquals(listOf(0), reported)
      field.applyVisible("closed")
      field.applyOptions(options.map { it.copy(disabled = false) })
      field.applyVisible("open")
    }
    settle()
    onView(withText("Modal unavailable")).perform(click())
    settle()
    onMain {
      assertEquals(listOf(0, 1), reported)
      field.applyVisible("closed")
    }
  }

  @Test
  fun filteredMaterialOptionsKeepTheirDisabledStateAndPublicIndexes() {
    lateinit var field: PCSelectionMenuView
    val reported = mutableListOf<Int>()
    onMain {
      field = PCSelectionMenuView(activity)
      field.applyAnchorMode("inline")
      field.applyAndroidMaterial("m3")
      field.applyAndroidSearchable(true)
      field.applyOptions(listOf(
        PCSelectionMenuView.Option("Alpha", "a"),
        PCSelectionMenuView.Option("Beta unavailable", "b", disabled = true),
        PCSelectionMenuView.Option("Beta available", "c")
      ))
      field.applySelectedData("a")
      field.onSelect = { index, _, _ -> reported.add(index) }
      host.addView(field)
    }
    settle()
    val filtered = CountDownLatch(1)
    onMain {
      val input = descendant<MaterialAutoCompleteTextView>(field)
      (input.adapter as Filterable).filter.filter("Beta") { filtered.countDown() }
    }
    assertTrue(filtered.await(5, TimeUnit.SECONDS))
    onMain {
      val input = descendant<MaterialAutoCompleteTextView>(field)
      assertEquals(2, input.adapter.count)
      assertFalse(input.adapter.isEnabled(0))
      assertTrue(input.adapter.isEnabled(1))
      input.onItemClickListener!!.onItemClick(null, null, 0, 0L)
      assertTrue(reported.isEmpty())
      // Both calls happen before the posted controlled-selection restoration.
      input.onItemClickListener!!.onItemClick(null, null, 1, 1L)
      assertEquals(listOf(2), reported)
    }
    settle()
    onMain { assertEquals("Alpha", descendant<MaterialAutoCompleteTextView>(field).text.toString()) }
  }

  @Test
  fun authenticatedImagesSeparateCacheEntriesAndHonorRequestOptions() {
    val server = ServerSocket(0)
    server.soTimeout = 15000
    val requests = Collections.synchronizedList(mutableListOf<String>())
    val failures = Collections.synchronizedList(mutableListOf<Throwable>())
    val worker = Thread {
      try {
        repeat(5) {
          server.accept().use { socket ->
            socket.soTimeout = 5000
            val reader = socket.getInputStream().bufferedReader()
            val line = reader.readLine()
            val headers = mutableMapOf<String, String>()
            while (true) {
              val header = reader.readLine()
              if (header.isNullOrEmpty()) break
              val parts = header.split(":", limit = 2)
              headers[parts[0].lowercase()] = parts[1].trim()
            }
            val body = CharArray(headers["content-length"]?.toInt() ?: 0)
            var offset = 0
            while (offset < body.size) {
              val count = reader.read(body, offset, body.size - offset)
              check(count > 0)
              offset += count
            }
            requests.add("$line|${headers["authorization"]}|${String(body)}")
            val output = socket.getOutputStream()
            if (line.contains("/redirect")) {
              output.write("HTTP/1.1 302 Found\r\nLocation: http://localhost:${server.localPort}/target\r\nContent-Length: 0\r\nConnection: close\r\n\r\n".toByteArray())
            } else {
              val color = when {
                String(body) == "pick=blue" -> Color.BLUE
                headers["authorization"] == "Bearer second" -> Color.GREEN
                else -> Color.RED
              }
              val bitmap = Bitmap.createBitmap(4, 4, Bitmap.Config.ARGB_8888).apply { eraseColor(color) }
              val bytes = ByteArrayOutputStream().also { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }.toByteArray()
              output.write("HTTP/1.1 200 OK\r\nContent-Type: image/png\r\nContent-Length: ${bytes.size}\r\nConnection: close\r\n\r\n".toByteArray())
              output.write(bytes)
            }
            output.flush()
          }
        }
      } catch (error: Throwable) { if (!server.isClosed) failures.add(error) }
    }.apply { start() }
    fun load(account: String, policy: String = "default", post: Boolean = false, path: String = "/icon"): Bitmap? {
      val request = JSONObject().put("headers", JSONObject().put("Authorization", "Bearer $account"))
        .put("cache", policy)
      if (post) request.put("method", "POST").put("body", "pick=blue")
      val done = CountDownLatch(1)
      var result: Bitmap? = null
      onMain {
        PCImageLoader.load(activity, "http://localhost:${server.localPort}$path", 1f, request.toString()) {
          result = it
          done.countDown()
        }
      }
      assertTrue("Image request did not complete; server errors: $failures", done.await(10, TimeUnit.SECONDS))
      return result
    }
    try {
      assertEquals(Color.RED, load("first")!!.getPixel(0, 0))
      assertEquals(Color.GREEN, load("second")!!.getPixel(0, 0))
      assertEquals(Color.RED, load("first")!!.getPixel(0, 0))
      assertEquals(Color.RED, load("first", "only-if-cached")!!.getPixel(0, 0))
      assertEquals(null, load("unknown", "only-if-cached"))
      assertEquals(2, requests.size)
      assertEquals(Color.RED, load("first", "reload")!!.getPixel(0, 0))
      assertEquals(Color.BLUE, load("first", post = true)!!.getPixel(0, 0))
      assertEquals(null, load("first", path = "/redirect"))
      worker.join(5000)
      assertFalse("Request server should have served exactly five requests", worker.isAlive)
      assertTrue("Server errors: $failures", failures.isEmpty())
      assertEquals(listOf(
        "GET /icon HTTP/1.1|Bearer first|",
        "GET /icon HTTP/1.1|Bearer second|",
        "GET /icon HTTP/1.1|Bearer first|",
        "POST /icon HTTP/1.1|Bearer first|pick=blue",
        "GET /redirect HTTP/1.1|Bearer first|"
      ), requests)
    } finally { server.close(); worker.join(1000) }
  }

  @Test
  fun navigationIconsKeepOriginalColorsAndTintOnlyOptedInStates() {
    val normal = imageIcon(Color.RED)
    val selected = imageIcon(Color.GREEN)
    val items = listOf(
      navigationItem("original", normal, selected),
      navigationItem("tinted", normal.copy(tinted = true), selected.copy(tinted = true)),
      navigationItem("mixed", normal, selected.copy(tinted = true))
    )
    onMain {
      val tabBar = PCTabBarView(activity).apply {
        applyColors(Color.YELLOW, Color.BLUE, null, null, null)
        applyTabs(items)
      }
      val rail = PCNavigationRailView(activity).apply {
        applyColors(Color.YELLOW, Color.BLUE, null, null, null)
        applyItems(items)
      }
      val controls: List<Pair<FrameLayout, (String) -> Unit>> = listOf(
        tabBar to { value -> tabBar.applySelectedValue(value) },
        rail to { value -> rail.applySelectedValue(value) }
      )
      for ((control, select) in controls) {
        host.addView(control)
        val bar = control.getChildAt(0) as NavigationBarView
        select("original")
        assertIconColor(bar, 0, Color.GREEN)
        assertIconColor(bar, 1, Color.BLUE)
        assertIconColor(bar, 2, Color.RED)
        select("tinted")
        assertIconColor(bar, 0, Color.RED)
        assertIconColor(bar, 1, Color.YELLOW)
        select("mixed")
        assertIconColor(bar, 1, Color.BLUE)
        assertIconColor(bar, 2, Color.YELLOW)
      }
    }
  }

  private fun navigationItem(value: String, icon: PCButtonSupport.Icon, selected: PCButtonSupport.Icon) =
    PCNavigationBarSupport.Item(value, value, false, icon, selected, "", "", "")

  private fun imageIcon(color: Int, preload: Boolean = true): PCButtonSupport.Icon {
    val bitmap = Bitmap.createBitmap(4, 4, Bitmap.Config.ARGB_8888).apply { eraseColor(color) }
    val bytes = ByteArrayOutputStream().also { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }.toByteArray()
    val uri = "data:image/png;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP)
    if (preload) {
      val loaded = CountDownLatch(1)
      onMain { PCImageLoader.load(activity, uri, 1f) { loaded.countDown() } }
      assertTrue("Image must be loaded before checking its rendered colors", loaded.await(5, TimeUnit.SECONDS))
    }
    return PCButtonSupport.Icon("image", "", uri, 1f, false)
  }

  private fun assertIconColor(bar: NavigationBarView, index: Int, expected: Int) {
    val item = (bar.menuView as ViewGroup).findViewById<View>(PCNavigationBarSupport.itemId(index))
    val icon = item.findViewById<ImageView>(com.google.android.material.R.id.navigation_bar_item_icon_view).drawable
    assertDrawableColor(icon, expected)
  }

  private fun assertDrawableColor(icon: Drawable?, expected: Int) {
    assertEquals("Rendered icon color", expected, drawableColor(icon))
  }

  private fun drawableColor(icon: Drawable?): Int {
    assertNotNull(icon)
    val drawable = icon!!
    val bitmap = Bitmap.createBitmap(4, 4, Bitmap.Config.ARGB_8888)
    val originalBounds = Rect(drawable.bounds)
    try {
      drawable.setBounds(0, 0, 4, 4)
      drawable.draw(Canvas(bitmap))
      return bitmap.getPixel(2, 2)
    } finally {
      drawable.bounds = originalBounds
    }
  }

  private fun waitForMainCondition(message: String, condition: () -> Boolean) {
    val deadline = SystemClock.uptimeMillis() + 5000
    while (SystemClock.uptimeMillis() < deadline) {
      var ready = false
      onMain { ready = condition() }
      if (ready) return
      SystemClock.sleep(10)
    }
    throw AssertionError(message)
  }

  private fun waitForViewToDisappear(text: String) {
    val deadline = SystemClock.uptimeMillis() + 5000
    while (true) {
      try {
        onView(withText(text)).check(doesNotExist())
        return
      } catch (failure: AssertionError) {
        if (SystemClock.uptimeMillis() >= deadline) throw failure
        SystemClock.sleep(50)
      }
    }
  }

  private fun openPicker(material: String, mode: String = "date"): PCDatePickerView {
    lateinit var picker: PCDatePickerView
    onMain {
      picker = PCDatePickerView(activity)
      picker.onCancel = { closed += 1 }
      picker.applyMode(mode)
      picker.applyDateMs(1_735_689_600_000L)
      picker.applyAndroidConfig(null, material, TITLE, null, null, null)
      host.addView(picker)
      picker.applyVisible("open")
    }
    settle()
    return picker
  }

  private fun materialDatePicker(tag: String = "PCDatePicker_M3_DATE"): MaterialDatePicker<*> =
    activity.supportFragmentManager.findFragmentByTag(tag) as MaterialDatePicker<*>

  private fun inputIn(view: View): TextInputEditText {
    return descendant(view)
  }

  private inline fun <reified T : View> descendant(view: View): T =
    descendants(view).filterIsInstance<T>().first()

  private fun descendants(view: View): Sequence<View> = sequence {
    yield(view)
    if (view is ViewGroup) for (index in 0 until view.childCount) yieldAll(descendants(view.getChildAt(index)))
  }

  private fun segment(value: String) = PCSegmentedControlView.Segment(
    value, value, false, "", "", "", 1f, true, "", ""
  )

  private fun onMain(action: () -> Unit) = instrumentation.runOnMainSync(action)

  private fun settle() {
    instrumentation.waitForIdleSync()
    onMain { activity.supportFragmentManager.executePendingTransactions() }
    instrumentation.waitForIdleSync()
  }

  companion object {
    private const val TITLE = "Native date picker regression"
  }
}
