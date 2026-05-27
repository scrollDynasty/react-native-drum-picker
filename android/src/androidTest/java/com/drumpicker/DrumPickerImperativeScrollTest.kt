package com.drumpicker

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
class DrumPickerImperativeScrollTest {
  private fun awaitSelectedIndex(
    scenario: ActivityScenario<TestActivity>,
    expected: Int,
  ) {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
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
    assertEquals(expected, selectedIndex)
  }

  @Test
  fun scrollAnimatedPropSelectsIndex() {
    ActivityScenario.launch(TestActivity::class.java).use { scenario ->
      scenario.onActivity { activity ->
        activity.picker.setScrollAnimatedProp(true)
        activity.picker.setSelectedIndexProp(5)
        activity.picker.requestLayout()
      }
      awaitSelectedIndex(scenario, 5)
    }
  }

  @Test
  fun scrollAnimatedFlagAppliesOnlyToNextSelection() {
    ActivityScenario.launch(TestActivity::class.java).use { scenario ->
      scenario.onActivity { activity ->
        activity.picker.setScrollAnimatedProp(true)
        activity.picker.setSelectedIndexProp(3)
        activity.picker.requestLayout()
      }
      awaitSelectedIndex(scenario, 3)

      scenario.onActivity { activity ->
        activity.picker.setSelectedIndexProp(6)
        activity.picker.requestLayout()
      }
      awaitSelectedIndex(scenario, 6)
    }
  }

  @Test
  fun directSetSelectedIndexAnimatedUpdatesSelection() {
    ActivityScenario.launch(TestActivity::class.java).use { scenario ->
      scenario.onActivity { activity ->
        activity.picker.setSelectedIndex(4, animated = true)
        activity.picker.requestLayout()
      }
      awaitSelectedIndex(scenario, 4)
    }
  }
}
