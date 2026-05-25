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
class DrumPickerTapTest {
  private fun readSelectedIndex(
    scenario: ActivityScenario<TestActivity>,
  ): Int {
    val latch = CountDownLatch(1)
    var selectedIndex = -1
    scenario.onActivity { activity ->
      activity.picker.post {
        selectedIndex = activity.picker.selectedIndexForTesting()
        latch.countDown()
      }
    }
    assertTrue(latch.await(3, TimeUnit.SECONDS))
    return selectedIndex
  }

  private fun waitForSelectedIndex(
    scenario: ActivityScenario<TestActivity>,
    expected: Int,
    timeoutMs: Long = 5000,
  ) {
    val deadline = System.currentTimeMillis() + timeoutMs
    while (System.currentTimeMillis() < deadline) {
      if (readSelectedIndex(scenario) == expected) {
        return
      }
      Thread.sleep(50)
    }
    assertEquals(expected, readSelectedIndex(scenario))
  }

  @Test
  fun tapOnRowScrollsSelectionWhenEnabled() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    ActivityScenario.launch(TestActivity::class.java).use { scenario ->
      scenario.onActivity { activity ->
        activity.picker.setEnableScrollByTapOnItemProp(true)
        activity.picker.setSelectedIndexProp(2)
        activity.picker.requestLayout()
      }
      instrumentation.waitForIdleSync()
      waitForSelectedIndex(scenario, 2)

      scenario.onActivity { activity ->
        activity.picker.testingClickRow(0)
      }
      instrumentation.waitForIdleSync()
      waitForSelectedIndex(scenario, 0)

      onView(withContentDescription("Alpha")).check(matches(isDisplayed()))
    }
  }

  @Test
  fun tapIgnoredWhenDisabled() {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    ActivityScenario.launch(TestActivity::class.java).use { scenario ->
      scenario.onActivity { activity ->
        activity.picker.setEnableScrollByTapOnItemProp(false)
        activity.picker.setSelectedIndexProp(2)
        activity.picker.requestLayout()
      }
      instrumentation.waitForIdleSync()
      waitForSelectedIndex(scenario, 2)

      scenario.onActivity { activity ->
        activity.picker.testingPerformItemTap(0)
      }
      instrumentation.waitForIdleSync()
      assertEquals(2, readSelectedIndex(scenario))

      scenario.onActivity { activity ->
        activity.picker.testingClickRow(0)
      }
      instrumentation.waitForIdleSync()
      assertEquals(2, readSelectedIndex(scenario))
    }
  }
}
