package com.drumpicker

import android.graphics.Color

/**
 * Visual defaults only. Row labels always come from the JS `items` prop.
 */
internal object DrumPickerDefaults {
  const val ITEM_HEIGHT_DP = 44f
  const val VISIBLE_ITEM_COUNT = 5
  const val TEXT_SIZE_SP = 20f
  const val SELECTED_TEXT_SIZE_SP = 22f
  const val SELECTION_INDICATOR_HEIGHT_DP = 1f

  val TEXT_COLOR: Int = Color.parseColor("#8E8E93")
  val SELECTED_TEXT_COLOR: Int = Color.parseColor("#1C1C1E")
  val SELECTION_INDICATOR_COLOR: Int = Color.parseColor("#D1D1D6")
}
