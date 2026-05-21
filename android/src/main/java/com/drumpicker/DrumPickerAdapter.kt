package com.drumpicker

import android.graphics.Typeface
import android.util.TypedValue
import android.view.Gravity
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import kotlin.math.abs

internal class DrumPickerAdapter(
  private val defaultItemHeightPx: () -> Int,
) : RecyclerView.Adapter<DrumPickerAdapter.ItemViewHolder>() {

  var items: List<String> = emptyList()
    set(value) {
      field = value
      notifyDataSetChanged()
    }

  var itemHeightPx: Int = 0
  var textColor: Int = DrumPickerDefaults.TEXT_COLOR
  var selectedTextColor: Int = DrumPickerDefaults.SELECTED_TEXT_COLOR
  var textSizeSp: Float = DrumPickerDefaults.TEXT_SIZE_SP
  var selectedTextSizeSp: Float = DrumPickerDefaults.SELECTED_TEXT_SIZE_SP

  private val regularTypeface = Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL)
  private val selectedTypeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)

  private fun rowHeightPx(): Int =
    if (itemHeightPx > 0) itemHeightPx else defaultItemHeightPx()

  override fun getItemCount(): Int = items.size

  override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ItemViewHolder {
    val height = rowHeightPx()
    val textView =
      TextView(parent.context).apply {
        gravity = Gravity.CENTER
        includeFontPadding = false
        layoutParams =
          RecyclerView.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            height,
          )
      }
    return ItemViewHolder(textView)
  }

  override fun onBindViewHolder(holder: ItemViewHolder, position: Int) {
    val textView = holder.textView
    val height = rowHeightPx()
    textView.layoutParams =
      (textView.layoutParams as RecyclerView.LayoutParams).apply { this.height = height }
    textView.text = items[position]
    applyItemStyle(textView, 2f)
  }

  fun applyItemStyle(textView: TextView, distanceFromCenter: Float) {
    val clampedDistance = abs(distanceFromCenter).coerceIn(0f, 3f)
    val focus = (1f - clampedDistance / 3f).coerceIn(0f, 1f)

    textView.alpha = 0.28f + 0.72f * focus
    textView.setTextColor(if (focus >= 0.65f) selectedTextColor else textColor)
    textView.setTextSize(
      TypedValue.COMPLEX_UNIT_SP,
      textSizeSp + (selectedTextSizeSp - textSizeSp) * focus,
    )
    textView.typeface = if (focus >= 0.65f) selectedTypeface else regularTypeface
  }

  class ItemViewHolder(val textView: TextView) : RecyclerView.ViewHolder(textView)
}
