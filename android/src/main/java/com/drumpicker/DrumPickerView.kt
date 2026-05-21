package com.drumpicker

import android.content.Context
import android.graphics.Color
import android.util.AttributeSet
import android.view.View
import android.widget.FrameLayout
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.LinearSnapHelper
import androidx.recyclerview.widget.RecyclerView
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import kotlin.math.abs

class DrumPickerView @JvmOverloads constructor(
  context: Context,
  attrs: AttributeSet? = null,
) : FrameLayout(context, attrs) {

  private val recyclerView = RecyclerView(context)
  private val topIndicator = View(context)
  private val bottomIndicator = View(context)
  private val layoutManager = LinearLayoutManager(context, RecyclerView.VERTICAL, false)
  private val snapHelper = LinearSnapHelper()
  private val adapter = DrumPickerAdapter { dpToPx(itemHeightDp) }

  private var items: List<String> = emptyList()
  private var selectedIndex = 0
  private var itemHeightDp = DrumPickerDefaults.ITEM_HEIGHT_DP
  private var visibleItemCount = DrumPickerDefaults.VISIBLE_ITEM_COUNT
  private var textColor = DrumPickerDefaults.TEXT_COLOR
  private var selectedTextColor = DrumPickerDefaults.SELECTED_TEXT_COLOR
  private var textSizeSp = DrumPickerDefaults.TEXT_SIZE_SP
  private var selectedTextSizeSp = DrumPickerDefaults.SELECTED_TEXT_SIZE_SP
  private var showSelectionIndicator = true
  private var selectionIndicatorColor = DrumPickerDefaults.SELECTION_INDICATOR_COLOR
  private var selectionIndicatorHeightDp = DrumPickerDefaults.SELECTION_INDICATOR_HEIGHT_DP

  private var itemHeightPx = dpToPx(itemHeightDp)
  private var selectionIndicatorHeightPx = dpToPx(selectionIndicatorHeightDp)
  private var lastEmittedIndex = -1
  private var suppressChangeEvent = false

  init {
    recyclerView.setBackgroundColor(Color.TRANSPARENT)
    recyclerView.layoutManager = layoutManager
    recyclerView.adapter = adapter
    recyclerView.overScrollMode = RecyclerView.OVER_SCROLL_NEVER
    recyclerView.clipToPadding = false
    snapHelper.attachToRecyclerView(recyclerView)

    topIndicator.isClickable = false
    topIndicator.isFocusable = false
    bottomIndicator.isClickable = false
    bottomIndicator.isFocusable = false

    addView(
      recyclerView,
      LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT),
    )
    addView(topIndicator, LayoutParams(LayoutParams.MATCH_PARENT, selectionIndicatorHeightPx))
    addView(bottomIndicator, LayoutParams(LayoutParams.MATCH_PARENT, selectionIndicatorHeightPx))

    recyclerView.addOnScrollListener(
      object : RecyclerView.OnScrollListener() {
        override fun onScrolled(recyclerView: RecyclerView, dx: Int, dy: Int) {
          updateVisibleItemStyles()
        }

        override fun onScrollStateChanged(recyclerView: RecyclerView, newState: Int) {
          if (newState == RecyclerView.SCROLL_STATE_IDLE) {
            updateCenterFromSnap()
          }
        }
      },
    )

    syncAdapterStyle()
    applyRecyclerPadding()
    updateIndicatorAppearance()
  }

  fun setItemsProp(value: Any?) {
    items = parseItems(value)
    adapter.items = items
    lastEmittedIndex = -1

    if (items.isEmpty()) {
      return
    }

    val clamped = selectedIndex.coerceIn(0, items.size - 1)
    if (clamped != selectedIndex) {
      selectedIndex = clamped
    }
    post { scrollToSelectedIndex(animated = false, emit = false) }
  }

  fun setSelectedIndexProp(value: Any?) {
    setSelectedIndex(toInt(value, selectedIndex))
  }

  fun setItemHeightProp(value: Any?) {
    setItemHeight(toFloat(value, itemHeightDp))
  }

  fun setVisibleItemCountProp(value: Any?) {
    setVisibleItemCount(toInt(value, visibleItemCount))
  }

  fun setTextColorProp(value: Any?) {
    setTextColor(resolveColor(value, textColor))
  }

  fun setSelectedTextColorProp(value: Any?) {
    setSelectedTextColor(resolveColor(value, selectedTextColor))
  }

  fun setTextSizeProp(value: Any?) {
    setTextSize(toFloat(value, textSizeSp))
  }

  fun setSelectedTextSizeProp(value: Any?) {
    setSelectedTextSize(toFloat(value, selectedTextSizeSp))
  }

  fun setShowSelectionIndicatorProp(value: Any?) {
    showSelectionIndicator = toBoolean(value, true)
    updateIndicatorAppearance()
    requestLayout()
  }

  fun setSelectionIndicatorColorProp(value: Any?) {
    selectionIndicatorColor = resolveColor(value, selectionIndicatorColor)
    updateIndicatorAppearance()
  }

  fun setSelectionIndicatorHeightProp(value: Any?) {
    val height = toFloat(value, selectionIndicatorHeightDp)
    if (height <= 0f) {
      return
    }
    selectionIndicatorHeightDp = height
    selectionIndicatorHeightPx = dpToPx(selectionIndicatorHeightDp)
    updateIndicatorAppearance()
    requestLayout()
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val width = resolveSize(suggestedMinimumWidth, widthMeasureSpec)
    val height =
      resolveSize(
        (itemHeightPx * visibleItemCount).coerceAtLeast(suggestedMinimumHeight),
        heightMeasureSpec,
      )

    val childWidthSpec = MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY)
    val childHeightSpec = MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    recyclerView.measure(childWidthSpec, childHeightSpec)
    setMeasuredDimension(width, height)
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    val width = right - left
    val height = bottom - top
    recyclerView.layout(0, 0, width, height)
    layoutSelectionIndicators(width, height)
    if (changed) {
      applyRecyclerPadding()
      post { scrollToSelectedIndex(animated = false, emit = false) }
    }
  }

  fun setSelectedIndex(index: Int) {
    if (items.isEmpty()) {
      selectedIndex = index
      return
    }
    val clamped = index.coerceIn(0, items.size - 1)
    if (clamped == selectedIndex) {
      return
    }
    selectedIndex = clamped
    scrollToSelectedIndex(animated = false, emit = false)
  }

  fun setItemHeight(height: Float) {
    if (height <= 0f || height == itemHeightDp) {
      return
    }
    itemHeightDp = height
    itemHeightPx = dpToPx(itemHeightDp)
    adapter.itemHeightPx = itemHeightPx
    applyRecyclerPadding()
    requestLayout()
  }

  fun setVisibleItemCount(count: Int) {
    if (count <= 0 || count == visibleItemCount) {
      return
    }
    visibleItemCount = count
    applyRecyclerPadding()
    requestLayout()
  }

  fun setTextColor(color: Int) {
    textColor = color
    syncAdapterStyle()
    updateVisibleItemStyles()
  }

  fun setSelectedTextColor(color: Int) {
    selectedTextColor = color
    syncAdapterStyle()
    updateVisibleItemStyles()
  }

  fun setTextSize(size: Float) {
    if (size <= 0f) {
      return
    }
    textSizeSp = size
    syncAdapterStyle()
    updateVisibleItemStyles()
  }

  fun setSelectedTextSize(size: Float) {
    if (size <= 0f) {
      return
    }
    selectedTextSizeSp = size
    syncAdapterStyle()
    updateVisibleItemStyles()
  }

  private fun syncAdapterStyle() {
    adapter.textColor = textColor
    adapter.selectedTextColor = selectedTextColor
    adapter.textSizeSp = textSizeSp
    adapter.selectedTextSizeSp = selectedTextSizeSp
    adapter.itemHeightPx = itemHeightPx
  }

  private fun applyRecyclerPadding() {
    val verticalPadding = itemHeightPx * ((visibleItemCount - 1) / 2)
    recyclerView.setPadding(0, verticalPadding, 0, verticalPadding)
  }

  private fun layoutSelectionIndicators(width: Int, height: Int) {
    if (!showSelectionIndicator || width == 0 || height == 0) {
      topIndicator.visibility = GONE
      bottomIndicator.visibility = GONE
      return
    }

    topIndicator.visibility = VISIBLE
    bottomIndicator.visibility = VISIBLE

    val bandTop = (height - itemHeightPx) / 2
    val bandBottom = bandTop + itemHeightPx
    topIndicator.layout(0, bandTop, width, bandTop + selectionIndicatorHeightPx)
    bottomIndicator.layout(0, bandBottom - selectionIndicatorHeightPx, width, bandBottom)
  }

  private fun updateIndicatorAppearance() {
    val visibility = if (showSelectionIndicator) VISIBLE else GONE
    topIndicator.visibility = visibility
    bottomIndicator.visibility = visibility
    topIndicator.setBackgroundColor(selectionIndicatorColor)
    bottomIndicator.setBackgroundColor(selectionIndicatorColor)

    (topIndicator.layoutParams as LayoutParams).height = selectionIndicatorHeightPx
    (bottomIndicator.layoutParams as LayoutParams).height = selectionIndicatorHeightPx
    topIndicator.requestLayout()
    bottomIndicator.requestLayout()
  }

  private fun scrollToSelectedIndex(animated: Boolean, emit: Boolean) {
    if (items.isEmpty()) {
      return
    }
    suppressChangeEvent = !emit
    val index = selectedIndex.coerceIn(0, items.size - 1)
    if (animated) {
      recyclerView.smoothScrollToPosition(index)
    } else {
      layoutManager.scrollToPositionWithOffset(index, 0)
      updateVisibleItemStyles()
      if (emit) {
        maybeEmitChange(index)
      }
    }
    suppressChangeEvent = false
  }

  private fun updateCenterFromSnap() {
    if (items.isEmpty()) {
      return
    }
    val centerView = snapHelper.findSnapView(layoutManager) ?: return
    val centerIndex = layoutManager.getPosition(centerView)
    if (centerIndex == RecyclerView.NO_POSITION) {
      return
    }

    selectedIndex = centerIndex
    updateVisibleItemStyles()
    maybeEmitChange(centerIndex)
  }

  private fun updateVisibleItemStyles() {
    if (recyclerView.height == 0) {
      return
    }

    val pickerCenterY = recyclerView.height / 2f
    for (i in 0 until recyclerView.childCount) {
      val child = recyclerView.getChildAt(i)
      val holder = recyclerView.getChildViewHolder(child) as? DrumPickerAdapter.ItemViewHolder
        ?: continue
      val childCenterY = child.top + child.height / 2f
      val distance = abs(childCenterY - pickerCenterY) / itemHeightPx.toFloat()
      adapter.applyItemStyle(holder.textView, distance)
    }
  }

  private fun maybeEmitChange(index: Int) {
    if (suppressChangeEvent || index == lastEmittedIndex || items.isEmpty()) {
      return
    }
    if (index < 0 || index >= items.size) {
      return
    }

    lastEmittedIndex = index
    selectedIndex = index

    val reactContext = context as ReactContext
    val dispatcher: EventDispatcher? = UIManagerHelper.getEventDispatcher(reactContext)
    dispatcher?.dispatchEvent(
      DrumPickerChangeEvent(
        UIManagerHelper.getSurfaceId(reactContext),
        id,
        index,
        items[index],
      ),
    )
  }

  private fun parseItems(value: Any?): List<String> {
    when (value) {
      null -> return emptyList()
      is ReadableArray -> {
        val parsed = ArrayList<String>(value.size())
        for (i in 0 until value.size()) {
          parsed.add(readArrayString(value, i))
        }
        return parsed
      }
      is List<*> -> return value.mapNotNull { it?.toString() }
      is Array<*> -> return value.mapNotNull { it?.toString() }
      else -> return emptyList()
    }
  }

  private fun readArrayString(array: ReadableArray, index: Int): String =
    when (array.getType(index)) {
      ReadableType.String -> array.getString(index) ?: ""
      ReadableType.Number -> array.getDouble(index).toInt().toString()
      else -> array.getDynamic(index).asString() ?: ""
    }

  private fun resolveColor(value: Any?, fallback: Int): Int =
    when (value) {
      is Int -> value
      null -> fallback
      else -> ColorPropConverter.getColor(value, context) ?: fallback
    }

  private fun toBoolean(value: Any?, fallback: Boolean): Boolean =
    when (value) {
      null -> fallback
      is Boolean -> value
      is Number -> value.toInt() != 0
      else -> fallback
    }

  private fun toInt(value: Any?, fallback: Int): Int =
    when (value) {
      null -> fallback
      is Int -> value
      is Double -> value.toInt()
      is Float -> value.toInt()
      is Number -> value.toInt()
      else -> fallback
    }

  private fun toFloat(value: Any?, fallback: Float): Float =
    when (value) {
      null -> fallback
      is Float -> value
      is Double -> value.toFloat()
      is Int -> value.toFloat()
      is Number -> value.toFloat()
      else -> fallback
    }

  private fun dpToPx(dp: Float): Int =
    (dp * resources.displayMetrics.density + 0.5f).toInt()
}
