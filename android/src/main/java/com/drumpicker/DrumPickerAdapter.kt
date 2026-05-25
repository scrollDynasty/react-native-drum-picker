package com.drumpicker

import android.graphics.Typeface
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import kotlin.math.abs
import kotlin.math.roundToInt

internal class DrumPickerAdapter(
  private val defaultItemHeightPx: () -> Int,
) : RecyclerView.Adapter<DrumPickerAdapter.ItemViewHolder>() {

  private companion object {
    const val TAP_SLOP_PX = 8f
  }

  var items: List<String> = emptyList()
    private set

  var itemHeightPx: Int = 0
  var textColor: Int = DrumPickerDefaults.TEXT_COLOR
  var selectedTextColor: Int = DrumPickerDefaults.SELECTED_TEXT_COLOR
  var textSizeSp: Float = DrumPickerDefaults.TEXT_SIZE_SP
  var selectedTextSizeSp: Float = DrumPickerDefaults.SELECTED_TEXT_SIZE_SP
  var itemBackgroundColor: Int = DrumPickerDefaults.TRANSPARENT

  var distanceForPosition: ((position: Int) -> Float)? = null
  var onItemTap: ((position: Int) -> Unit)? = null
  var enableScrollByTapOnItem: Boolean = false

  private val regularTypeface = Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL)
  private val selectedTypeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)

  private fun rowHeightPx(): Int =
    if (itemHeightPx > 0) itemHeightPx else defaultItemHeightPx()

  fun updateItems(newItems: List<String>): Boolean {
    if (newItems == items) {
      return false
    }
    val oldItems = items
    items = newItems
    when {
      oldItems.size == newItems.size ->
        notifyItemRangeChanged(0, newItems.size)
      else ->
        notifyDataSetChanged()
    }
    return true
  }

  fun notifyRowMetricsChanged() {
    if (items.isNotEmpty()) {
      notifyItemRangeChanged(0, items.size)
    }
  }

  override fun getItemCount(): Int = items.size

  override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ItemViewHolder {
    val height = rowHeightPx()
    val textView =
      TextView(parent.context).apply {
        gravity = Gravity.CENTER
        includeFontPadding = false
        setBackgroundColor(itemBackgroundColor)
        layoutParams =
          RecyclerView.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            height,
          )
      }
    val holder = ItemViewHolder(textView)
    holder.itemView.setOnClickListener {
      if (!enableScrollByTapOnItem) {
        return@setOnClickListener
      }
      val adapterPosition = holder.bindingAdapterPosition
      if (adapterPosition != RecyclerView.NO_POSITION) {
        onItemTap?.invoke(adapterPosition)
      }
    }
    holder.itemView.setOnTouchListener { view, event ->
      if (!enableScrollByTapOnItem) {
        return@setOnTouchListener false
      }
      handleRowTouch(holder, view, event)
    }
    return holder
  }

  override fun onBindViewHolder(holder: ItemViewHolder, position: Int) {
    val textView = holder.textView
    val height = rowHeightPx()
    textView.layoutParams =
      (textView.layoutParams as RecyclerView.LayoutParams).apply { this.height = height }
    textView.text = items[position]
    textView.contentDescription = items[position]
    textView.setBackgroundColor(itemBackgroundColor)
    holder.lastStyleBucket = Int.MIN_VALUE
    val distance = distanceForPosition?.invoke(position) ?: 2f
    applyItemStyle(holder, distance)
  }

  private fun handleRowTouch(
    holder: ItemViewHolder,
    view: android.view.View,
    event: MotionEvent,
  ): Boolean {
    when (event.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        holder.touchDownX = event.x
        holder.touchDownY = event.y
        holder.movedPastSlop = false
        view.parent?.requestDisallowInterceptTouchEvent(true)
        return true
      }
      MotionEvent.ACTION_MOVE -> {
        if (!holder.movedPastSlop) {
          val dx = abs(event.x - holder.touchDownX)
          val dy = abs(event.y - holder.touchDownY)
          if (dx > TAP_SLOP_PX || dy > TAP_SLOP_PX) {
            holder.movedPastSlop = true
            view.parent?.requestDisallowInterceptTouchEvent(false)
            return false
          }
        }
        return true
      }
      MotionEvent.ACTION_UP -> {
        view.parent?.requestDisallowInterceptTouchEvent(false)
        if (!holder.movedPastSlop) {
          view.performClick()
        }
        return true
      }
      MotionEvent.ACTION_CANCEL -> {
        view.parent?.requestDisallowInterceptTouchEvent(false)
        holder.movedPastSlop = false
        return true
      }
      else -> return true
    }
  }

  fun applyItemStyle(holder: ItemViewHolder, distanceFromCenter: Float) {
    val clampedDistance = abs(distanceFromCenter).coerceIn(0f, 3f)
    val focus = (1f - clampedDistance / 3f).coerceIn(0f, 1f)
    val bucket = (focus * 24f).roundToInt()

    if (holder.lastStyleBucket == bucket) {
      return
    }
    holder.lastStyleBucket = bucket

    val textView = holder.textView
    textView.alpha = 0.28f + 0.72f * focus
    textView.setTextColor(if (focus >= 0.65f) selectedTextColor else textColor)
    textView.setTextSize(
      TypedValue.COMPLEX_UNIT_SP,
      textSizeSp + (selectedTextSizeSp - textSizeSp) * focus,
    )
    textView.typeface = if (focus >= 0.65f) selectedTypeface else regularTypeface
  }

  class ItemViewHolder(val textView: TextView) : RecyclerView.ViewHolder(textView) {
    var lastStyleBucket: Int = Int.MIN_VALUE
    var touchDownX: Float = 0f
    var touchDownY: Float = 0f
    var movedPastSlop: Boolean = false
  }
}
