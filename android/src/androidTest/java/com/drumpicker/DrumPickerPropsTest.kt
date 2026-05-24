package com.drumpicker

import android.graphics.Color
import android.view.View
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class DrumPickerPropsTest {
  @Test
  fun appliesTextColorToRows() {
    ActivityScenario.launch(TestActivity::class.java).use { scenario ->
      scenario.onActivity { activity ->
        activity.picker.setTextColorProp(Color.RED)
        val recycler = activity.picker.getChildAt(0) as RecyclerView
        val row = recycler.getChildAt(0) as TextView
        assertEquals(Color.RED, row.currentTextColor)
      }
    }
  }

  @Test
  fun appliesItemHeightToRows() {
    ActivityScenario.launch(TestActivity::class.java).use { scenario ->
      scenario.onActivity { activity ->
        activity.picker.setItemHeightProp(60f)
        val recycler = activity.picker.getChildAt(0) as RecyclerView
        val row = recycler.getChildAt(0) as TextView
        assertTrue(row.layoutParams.height >= 60)
      }
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
