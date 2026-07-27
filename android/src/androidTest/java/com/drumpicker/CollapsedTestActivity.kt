package com.drumpicker

import android.os.Bundle
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity

/**
 * Hosts the picker inside a container that starts with zero height, mirroring the
 * `{isOpen ? <DrumPicker/> : null}` / collapsed-accordion mounting pattern.
 */
class CollapsedTestActivity : AppCompatActivity() {
  lateinit var picker: DrumPickerView
  private lateinit var container: FrameLayout

  companion object {
    const val ITEM_HEIGHT_DP = 44f
    const val VISIBLE_ITEM_COUNT = 5

    val ITEMS: List<String> =
      listOf(
        "Alpha",
        "Beta",
        "Gamma",
        "Delta",
        "Echo",
        "Foxtrot",
        "Golf",
        "Hotel",
        "India",
        "Juliett",
      )
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    picker = DrumPickerView(this)
    container = FrameLayout(this)
    container.addView(
      picker,
      FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT,
      ),
    )
    setContentView(
      container,
      ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0),
    )
  }

  /** Grows the container to the picker's natural height, as an accordion would. */
  fun expand() {
    val density = resources.displayMetrics.density
    val height = (ITEM_HEIGHT_DP * density + 0.5f).toInt() * VISIBLE_ITEM_COUNT
    container.layoutParams = container.layoutParams.apply { this.height = height }
    container.requestLayout()
  }
}
