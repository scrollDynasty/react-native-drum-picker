package com.drumpicker

import android.graphics.Color
import android.util.TypedValue
import android.view.Gravity
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

internal class DrumPickerAdapter(
  private val defaultItemHeightPx: () -> Int,
) : RecyclerView.Adapter<DrumPickerAdapter.ItemViewHolder>() {

  var items: List<String> = emptyList()
    set(value) {
      field = value
      notifyDataSetChanged()
    }

  var centerPosition: Int = 0
    set(value) {
      if (field != value) {
        field = value
        notifyDataSetChanged()
      }
    }

  var itemHeightPx: Int = 0
  var textColor: Int = Color.GRAY
  var selectedTextColor: Int = Color.BLACK
  var textSizeSp: Float = 18f
  var selectedTextSizeSp: Float = 22f

  private fun rowHeightPx(): Int =
    if (itemHeightPx > 0) itemHeightPx else defaultItemHeightPx()

  override fun getItemCount(): Int = items.size

  override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ItemViewHolder {
    val height = rowHeightPx()
    val textView =
      TextView(parent.context).apply {
        gravity = Gravity.CENTER
        layoutParams =
          RecyclerView.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            height,
          )
      }
    return ItemViewHolder(textView)
  }

  override fun onBindViewHolder(holder: ItemViewHolder, position: Int) {
    val isSelected = position == centerPosition
    val textView = holder.textView
    val height = rowHeightPx()
    textView.layoutParams =
      (textView.layoutParams as RecyclerView.LayoutParams).apply { this.height = height }
    textView.text = items[position]
    textView.setTextColor(if (isSelected) selectedTextColor else textColor)
    textView.setTextSize(
      TypedValue.COMPLEX_UNIT_SP,
      if (isSelected) selectedTextSizeSp else textSizeSp,
    )
    textView.alpha = if (isSelected) 1f else 0.45f
  }

  class ItemViewHolder(val textView: TextView) : RecyclerView.ViewHolder(textView)
}
