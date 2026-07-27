package com.drumpicker

import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.uimanager.ReactStylesDiffMap
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Regression coverage for the integration defects reported against 0.2.4:
 *
 * 1. mounting in a zero-height container left the wheel on index 0;
 * 2. after a programmatic scroll only the centre row was laid out;
 * 3. changing `items` kept the scroll position instead of the selected value and emitted a
 *    spurious change event;
 * 5. the centred row and the reported selected index disagreed.
 */
@RunWith(AndroidJUnit4::class)
class DrumPickerRegressionTest {
  private fun <A : androidx.appcompat.app.AppCompatActivity> onUiThread(
    scenario: ActivityScenario<A>,
    block: (A) -> Unit,
  ) {
    scenario.onActivity { block(it) }
    InstrumentationRegistry.getInstrumentation().waitForIdleSync()
  }

  private fun <A : androidx.appcompat.app.AppCompatActivity, T> readAfterFrame(
    scenario: ActivityScenario<A>,
    read: (A) -> T,
  ): T {
    InstrumentationRegistry.getInstrumentation().waitForIdleSync()
    val latch = CountDownLatch(1)
    var result: T? = null
    scenario.onActivity { activity ->
      activity.window.decorView.post {
        result = read(activity)
        latch.countDown()
      }
    }
    assertTrue("timed out reading picker state", latch.await(5, TimeUnit.SECONDS))
    @Suppress("UNCHECKED_CAST")
    return result as T
  }

  // --- Defect 1 + 5: mount without size, then get one -----------------------------------------

  @Test
  fun centersSelectedIndexWhenMountedInZeroHeightContainer() {
    ActivityScenario.launch(CollapsedTestActivity::class.java).use { scenario ->
      onUiThread(scenario) { activity ->
        activity.picker.setItemsProp(CollapsedTestActivity.ITEMS)
        activity.picker.setItemHeightProp(CollapsedTestActivity.ITEM_HEIGHT_DP)
        activity.picker.setVisibleItemCountProp(CollapsedTestActivity.VISIBLE_ITEM_COUNT)
        activity.picker.setSelectedIndexProp(7)
      }

      // Still collapsed: nothing is centred yet, and that is fine.
      onUiThread(scenario) { activity -> activity.expand() }

      val label = readAfterFrame(scenario) { it.picker.centeredLabelForTesting() }
      assertEquals("Hotel", label)

      val selected = readAfterFrame(scenario) { it.picker.selectedIndexForTesting() }
      val snapped = readAfterFrame(scenario) { it.picker.snapCenterIndexForTesting() }
      assertEquals(7, selected)
      assertEquals("centred row disagrees with reported index", selected, snapped)
    }
  }

  @Test
  fun controlledIndexChangeAfterMountMovesTheWheel() {
    ActivityScenario.launch(CollapsedTestActivity::class.java).use { scenario ->
      onUiThread(scenario) { activity ->
        activity.picker.setItemsProp(CollapsedTestActivity.ITEMS)
        activity.picker.setItemHeightProp(CollapsedTestActivity.ITEM_HEIGHT_DP)
        activity.picker.setVisibleItemCountProp(CollapsedTestActivity.VISIBLE_ITEM_COUNT)
        activity.picker.setSelectedIndexProp(2)
        activity.expand()
      }
      assertEquals("Gamma", readAfterFrame(scenario) { it.picker.centeredLabelForTesting() })

      val emitted = CopyOnWriteArrayList<Int>()
      onUiThread(scenario) { activity ->
        activity.picker.changeEventListenerForTesting = { emitted.add(it) }
        activity.picker.setSelectedIndexProp(5)
      }

      assertEquals("Foxtrot", readAfterFrame(scenario) { it.picker.centeredLabelForTesting() })
      assertEquals("prop-driven selection must not emit onChange", emptyList<Int>(), emitted)
    }
  }

  // --- Defect 2: neighbours -------------------------------------------------------------------

  @Test
  fun programmaticScrollLaysOutNeighbourRows() {
    ActivityScenario.launch(CollapsedTestActivity::class.java).use { scenario ->
      onUiThread(scenario) { activity ->
        activity.picker.setItemsProp(CollapsedTestActivity.ITEMS)
        activity.picker.setItemHeightProp(CollapsedTestActivity.ITEM_HEIGHT_DP)
        activity.picker.setVisibleItemCountProp(CollapsedTestActivity.VISIBLE_ITEM_COUNT)
        activity.picker.setSelectedIndexProp(6)
        activity.expand()
      }

      val rows = readAfterFrame(scenario) { it.picker.laidOutRowCountForTesting() }
      assertTrue("only $rows row(s) laid out — neighbours are missing", rows > 1)
      assertEquals("Golf", readAfterFrame(scenario) { it.picker.centeredLabelForTesting() })
    }
  }

  // --- Defect 3: items change -----------------------------------------------------------------

  @Test
  fun growingItemsKeepsSelectedValueAndStaysSilent() {
    ActivityScenario.launch(CollapsedTestActivity::class.java).use { scenario ->
      val years = (1966..2031).map(Int::toString)
      val widerYears = (1926..2076).map(Int::toString)

      onUiThread(scenario) { activity ->
        activity.picker.setItemsProp(years)
        activity.picker.setItemHeightProp(CollapsedTestActivity.ITEM_HEIGHT_DP)
        activity.picker.setVisibleItemCountProp(CollapsedTestActivity.VISIBLE_ITEM_COUNT)
        activity.picker.setSelectedIndexProp(years.indexOf("2026"))
        activity.expand()
      }
      assertEquals("2026", readAfterFrame(scenario) { it.picker.centeredLabelForTesting() })

      val emitted = CopyOnWriteArrayList<Int>()
      onUiThread(scenario) { activity ->
        activity.picker.changeEventListenerForTesting = { emitted.add(it) }
        // Fabric hands the props over as an unordered map: selectedIndex may land first.
        activity.picker.setSelectedIndexProp(widerYears.indexOf("2026"))
        activity.picker.setItemsProp(widerYears)
      }

      assertEquals("2026", readAfterFrame(scenario) { it.picker.centeredLabelForTesting() })
      assertEquals("range change must not emit onChange", emptyList<Int>(), emitted)
    }
  }

  @Test
  fun shrinkingItemsKeepsSelectedValueRegardlessOfPropOrder() {
    ActivityScenario.launch(CollapsedTestActivity::class.java).use { scenario ->
      val wide = (1926..2076).map(Int::toString)
      val narrow = (1966..2031).map(Int::toString)

      onUiThread(scenario) { activity ->
        activity.picker.setItemsProp(wide)
        activity.picker.setItemHeightProp(CollapsedTestActivity.ITEM_HEIGHT_DP)
        activity.picker.setVisibleItemCountProp(CollapsedTestActivity.VISIBLE_ITEM_COUNT)
        activity.picker.setSelectedIndexProp(wide.indexOf("2026"))
        activity.expand()
      }
      assertEquals("2026", readAfterFrame(scenario) { it.picker.centeredLabelForTesting() })

      val emitted = CopyOnWriteArrayList<Int>()
      onUiThread(scenario) { activity ->
        activity.picker.changeEventListenerForTesting = { emitted.add(it) }
        // selectedIndex (60) applied while the old 151-item list is still installed: clamping it
        // against the stale list is what used to move "2026" to a different year.
        activity.picker.setSelectedIndexProp(narrow.indexOf("2026"))
        activity.picker.setItemsProp(narrow)
      }

      assertEquals("2026", readAfterFrame(scenario) { it.picker.centeredLabelForTesting() })
      assertEquals("range change must not emit onChange", emptyList<Int>(), emitted)
    }
  }

  /**
   * The view-level tests above apply the setters in the worst possible order by hand. This one
   * goes through [DrumPickerViewManager.updateProperties] instead, which is what Fabric actually
   * calls — with a `ReactStylesDiffMap` whose backing HashMap has no meaningful iteration order.
   */
  @Test
  fun viewManagerAppliesItemsBeforeSelectedIndex() {
    ActivityScenario.launch(CollapsedTestActivity::class.java).use { scenario ->
      val manager = DrumPickerViewManager()
      val wide = (1926..2076).map(Int::toString)
      val narrow = (1966..2031).map(Int::toString)

      onUiThread(scenario) { activity ->
        manager.updateProperties(activity.picker, styleProps(wide, wide.indexOf("2026")))
        activity.picker.setItemHeightProp(CollapsedTestActivity.ITEM_HEIGHT_DP)
        activity.picker.setVisibleItemCountProp(CollapsedTestActivity.VISIBLE_ITEM_COUNT)
        activity.expand()
      }
      assertEquals("2026", readAfterFrame(scenario) { it.picker.centeredLabelForTesting() })

      val emitted = CopyOnWriteArrayList<Int>()
      onUiThread(scenario) { activity ->
        activity.picker.changeEventListenerForTesting = { emitted.add(it) }
        manager.updateProperties(activity.picker, styleProps(narrow, narrow.indexOf("2026")))
      }

      assertEquals("2026", readAfterFrame(scenario) { it.picker.centeredLabelForTesting() })
      assertEquals("prop transaction must not emit onChange", emptyList<Int>(), emitted)
    }
  }

  private fun styleProps(items: List<String>, selectedIndex: Int): ReactStylesDiffMap {
    val array = JavaOnlyArray()
    items.forEach { array.pushString(it) }
    val map = JavaOnlyMap()
    map.putArray("items", array)
    map.putInt("selectedIndex", selectedIndex)
    return ReactStylesDiffMap(map)
  }

  @Test
  fun dependentColumnItemsChangeKeepsSelection() {
    ActivityScenario.launch(CollapsedTestActivity::class.java).use { scenario ->
      val julyDays = (1..31).map(Int::toString)
      val juneDays = (1..30).map(Int::toString)

      onUiThread(scenario) { activity ->
        activity.picker.setItemsProp(julyDays)
        activity.picker.setItemHeightProp(CollapsedTestActivity.ITEM_HEIGHT_DP)
        activity.picker.setVisibleItemCountProp(CollapsedTestActivity.VISIBLE_ITEM_COUNT)
        activity.picker.setSelectedIndexProp(25) // day 26
        activity.expand()
      }
      assertEquals("26", readAfterFrame(scenario) { it.picker.centeredLabelForTesting() })

      val emitted = CopyOnWriteArrayList<Int>()
      onUiThread(scenario) { activity ->
        activity.picker.changeEventListenerForTesting = { emitted.add(it) }
        activity.picker.setItemsProp(juneDays)
        activity.picker.setSelectedIndexProp(25)
      }

      assertEquals("26", readAfterFrame(scenario) { it.picker.centeredLabelForTesting() })
      assertEquals("day-count change must not emit onChange", emptyList<Int>(), emitted)
    }
  }
}
