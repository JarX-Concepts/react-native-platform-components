package platformcomponents.example

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.uimanager.DisplayMetricsHolder

/** Isolated host for native widget regressions; the React demo is exercised by Detox. */
class NativeTestActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    DisplayMetricsHolder.initDisplayMetrics(this)
  }
}
