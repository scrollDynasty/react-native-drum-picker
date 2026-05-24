package com.drumpicker

import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.widget.FrameLayout

class TestActivity : Activity() {
  lateinit var picker: DrumPickerView
    private set

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val container =
      FrameLayout(this).apply {
        layoutParams =
          FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT,
          )
      }
    picker = DrumPickerView(this)
    container.addView(
      picker,
      FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.WRAP_CONTENT,
      ),
    )
    setContentView(container)
    picker.setItemsProp(listOf("Alpha", "Bravo", "Charlie", "Delta", "Echo"))
    picker.setItemHeightProp(44f)
    picker.setVisibleItemCountProp(5)
    picker.setTextColorProp(Color.GRAY)
    picker.setShowSelectionIndicatorProp(true)
  }
}
