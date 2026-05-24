package com.drumpicker

import android.graphics.Color
import android.view.View
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class DrumPickerPropsTest {
  @Test
  fun appliesTextColorToRows() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    ActivityScenario.launch(TestActivity::class.java).use { scenario ->
      scenario.onActivity { activity ->
        activity.picker.setTextColorProp(Color.RED)
        activity.picker.requestLayout()
      }
      instrumentation.waitForIdleSync()
      scenario.onActivity { activity ->
        val recycler = activity.picker.getChildAt(0) as RecyclerView
        val row = recycler.getChildAt(0) as TextView
        assertEquals(Color.RED, row.currentTextColor)
      }
    }
  }

  @Test
  fun appliesItemHeightToRows() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    ActivityScenario.launch(TestActivity::class.java).use { scenario ->
      scenario.onActivity { activity ->
        activity.picker.setItemHeightProp(60f)
        activity.picker.requestLayout()
      }
      instrumentation.waitForIdleSync()

      var rowHeight = 0
      val latch = CountDownLatch(1)
      scenario.onActivity { activity ->
        activity.picker.post {
          val recycler = activity.picker.getChildAt(0) as RecyclerView
          val row = recycler.getChildAt(0) as TextView
          rowHeight = row.layoutParams.height
          latch.countDown()
        }
      }
      assertTrue(latch.await(2, TimeUnit.SECONDS))
      assertTrue(rowHeight >= 60)
    }
  }

  @Test
  fun hidesSelectionIndicatorWhenDisabled() {
    ActivityScenario.launch(TestActivity::class.java).use { scenario ->
      scenario.onActivity { activity ->
        activity.picker.setShowSelectionIndicatorProp(false)
        val topIndicator = activity.picker.getChildAt(1)
        val bottomIndicator = activity.picker.getChildAt(2)
        assertEquals(View.GONE, topIndicator.visibility)
        assertEquals(View.GONE, bottomIndicator.visibility)
      }
    }
  }
}
