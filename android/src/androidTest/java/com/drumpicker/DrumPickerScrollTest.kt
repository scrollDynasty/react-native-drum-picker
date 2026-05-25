package com.drumpicker

import androidx.test.core.app.ActivityScenario
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withContentDescription
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class DrumPickerScrollTest {
  @Test
  fun programmaticIndexSelectionCentersRow() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    ActivityScenario.launch(TestActivity::class.java).use { scenario ->
      scenario.onActivity { activity ->
        activity.picker.setSelectedIndexProp(3)
        activity.picker.requestLayout()
      }
      instrumentation.waitForIdleSync()

      val latch = CountDownLatch(1)
      var selectedIndex = -1
      scenario.onActivity { activity ->
        activity.picker.post {
          selectedIndex = activity.picker.selectedIndexForTesting()
          latch.countDown()
        }
      }
      assertTrue(latch.await(3, TimeUnit.SECONDS))
      assertEquals(3, selectedIndex)

      onView(withContentDescription("Delta"))
        .check(matches(isDisplayed()))
    }
  }
}
