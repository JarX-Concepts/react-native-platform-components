package com.platformcomponents.datepicker

import com.google.android.material.datepicker.CalendarConstraints
import com.google.android.material.datepicker.DateValidatorPointBackward
import com.google.android.material.datepicker.DateValidatorPointForward
import java.util.TimeZone

object DateConstraints {
  fun build(minMs: Double, maxMs: Double, firstDayOfWeek: Int?): CalendarConstraints? {
    val hasMin = minMs >= 0
    val hasMax = maxMs >= 0
    if (!hasMin && !hasMax && firstDayOfWeek == null) return null

    val builder = CalendarConstraints.Builder()

    // First day of week: MaterialDatePicker uses java.util.Calendar constants. We map ISO 1..7.
    firstDayOfWeek?.let {
      val calDay = isoToCalendarDay(it)
      if (calDay != null) builder.setFirstDayOfWeek(calDay)
    }

    val validators = ArrayList<CalendarConstraints.DateValidator>(2)
    if (hasMin) validators.add(DateValidatorPointForward.from(minMs.toLong()))
    if (hasMax) validators.add(DateValidatorPointBackward.before(maxMs.toLong()))

    if (validators.isNotEmpty()) {
      builder.setValidator(CompositeValidator(validators))
    }

    return builder.build()
  }

  private fun isoToCalendarDay(iso: Int): Int? {
    // ISO: 1=Mon ... 7=Sun
    return when (iso) {
      1 -> java.util.Calendar.MONDAY
      2 -> java.util.Calendar.TUESDAY
      3 -> java.util.Calendar.WEDNESDAY
      4 -> java.util.Calendar.THURSDAY
      5 -> java.util.Calendar.FRIDAY
      6 -> java.util.Calendar.SATURDAY
      7 -> java.util.Calendar.SUNDAY
      else -> null
    }
  }

  private class CompositeValidator(
    private val validators: List<CalendarConstraints.DateValidator>
  ) : CalendarConstraints.DateValidator {

    override fun isValid(date: Long): Boolean {
      for (v in validators) if (!v.isValid(date)) return false
      return true
    }

    override fun describeContents(): Int = 0

    override fun writeToParcel(dest: android.os.Parcel, flags: Int) {
      dest.writeInt(validators.size)
      validators.forEach { dest.writeParcelable(it, flags) }
    }

    companion object {
      @JvmField
      val CREATOR: android.os.Parcelable.Creator<CompositeValidator> =
        object : android.os.Parcelable.Creator<CompositeValidator> {
          override fun createFromParcel(source: android.os.Parcel): CompositeValidator {
            val n = source.readInt()
            val list = ArrayList<CalendarConstraints.DateValidator>(n)
            repeat(n) {
              val v = source.readParcelable<CalendarConstraints.DateValidator>(
                CalendarConstraints.DateValidator::class.java.classLoader
              )
              if (v != null) list.add(v)
            }
            return CompositeValidator(list)
          }

          override fun newArray(size: Int): Array<CompositeValidator?> = arrayOfNulls(size)
        }
    }
  }
}