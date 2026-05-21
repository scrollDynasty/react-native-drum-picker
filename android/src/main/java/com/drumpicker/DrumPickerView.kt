package com.drumpicker

import android.content.Context
import android.graphics.Color
import android.util.AttributeSet
import android.util.Log
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

class DrumPickerView @JvmOverloads constructor(
  context: Context,
  attrs: AttributeSet? = null,
) : FrameLayout(context, attrs) {

  private val recyclerView = RecyclerView(context)
  private val layoutManager = LinearLayoutManager(context, RecyclerView.VERTICAL, false)
  private val snapHelper = LinearSnapHelper()
  private val adapter = DrumPickerAdapter { dpToPx(itemHeightDp) }

  private var items: List<String> = emptyList()
  private var selectedIndex = 0
  private var itemHeightDp = 44f
  private var visibleItemCount = 5
  private var textColor = Color.BLACK
  private var selectedTextColor = Color.BLACK
  private var textSizeSp = 18f
  private var selectedTextSizeSp = 22f

  private var itemHeightPx = dpToPx(itemHeightDp)
  private var lastEmittedIndex = -1
  private var suppressChangeEvent = false

  init {
    Log.d(TAG, "DrumPickerView init")

    recyclerView.setBackgroundColor(Color.parseColor("#F3F4F6"))
    recyclerView.layoutManager = layoutManager
    recyclerView.adapter = adapter
    recyclerView.overScrollMode = RecyclerView.OVER_SCROLL_NEVER
    recyclerView.clipToPadding = false
    snapHelper.attachToRecyclerView(recyclerView)

    addView(
      recyclerView,
      LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT),
    )

    recyclerView.addOnScrollListener(
      object : RecyclerView.OnScrollListener() {
        override fun onScrolled(recyclerView: RecyclerView, dx: Int, dy: Int) {
          refreshCenterHighlight()
        }

        override fun onScrollStateChanged(recyclerView: RecyclerView, newState: Int) {
          if (newState == RecyclerView.SCROLL_STATE_IDLE) {
            updateCenterFromSnap()
          }
        }
      },
    )

    adapter.textColor = textColor
    adapter.selectedTextColor = selectedTextColor
    adapter.textSizeSp = textSizeSp
    adapter.selectedTextSizeSp = selectedTextSizeSp
    adapter.itemHeightPx = itemHeightPx
    adapter.items = fallbackDebugItems()

    applyRecyclerPadding()
    post { scrollToSelectedIndex(animated = false, emit = false) }
  }

  fun setItemsProp(value: Any?) {
    Log.d(TAG, "setItemsProp type=${value?.javaClass?.name}")
    items = parseItems(value)
    Log.d(TAG, "setItemsProp parsedCount=${items.size} first=${items.firstOrNull()}")
    adapter.items = displayItems()
    val clamped = selectedIndex.coerceIn(0, (displayItems().size - 1).coerceAtLeast(0))
    if (clamped != selectedIndex) {
      selectedIndex = clamped
    }
    post { scrollToSelectedIndex(animated = false, emit = false) }
  }

  fun setSelectedIndexProp(value: Any?) {
    val index = toInt(value, selectedIndex)
    Log.d(TAG, "setSelectedIndexProp=$index")
    setSelectedIndex(index)
  }

  fun setItemHeightProp(value: Any?) {
    val height = toFloat(value, itemHeightDp)
    Log.d(TAG, "setItemHeightProp=$height")
    setItemHeight(height)
  }

  fun setVisibleItemCountProp(value: Any?) {
    val count = toInt(value, visibleItemCount)
    Log.d(TAG, "setVisibleItemCountProp=$count")
    setVisibleItemCount(count)
  }

  fun setTextColorProp(value: Any?) {
    val color =
      when (value) {
        is Int -> value
        else -> ColorPropConverter.getColor(value, context)
      }
    setTextColor(color)
  }

  fun setSelectedTextColorProp(value: Any?) {
    val color =
      when (value) {
        is Int -> value
        else -> ColorPropConverter.getColor(value, context)
      }
    setSelectedTextColor(color)
  }

  fun setTextSizeProp(value: Any?) {
    setTextSize(toFloat(value, textSizeSp))
  }

  fun setSelectedTextSizeProp(value: Any?) {
    setSelectedTextSize(toFloat(value, selectedTextSizeSp))
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
    Log.d(TAG, "onMeasure width=$width height=$height itemHeightPx=$itemHeightPx")
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    recyclerView.layout(0, 0, right - left, bottom - top)
    if (changed) {
      applyRecyclerPadding()
      post { scrollToSelectedIndex(animated = false, emit = false) }
    }
  }

  private fun displayItems(): List<String> =
    if (items.isEmpty()) fallbackDebugItems() else items

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
      else -> {
        Log.w(TAG, "parseItems unsupported type=${value.javaClass.name}")
        return emptyList()
      }
    }
  }

  private fun readArrayString(array: ReadableArray, index: Int): String =
    when (array.getType(index)) {
      ReadableType.String -> array.getString(index) ?: ""
      ReadableType.Number -> array.getDouble(index).toInt().toString()
      else -> array.getDynamic(index).asString() ?: ""
    }

  private fun fallbackDebugItems(): List<String> =
    listOf("DEBUG 1", "DEBUG 2", "DEBUG 3")

  fun setSelectedIndex(index: Int) {
    if (displayItems().isEmpty()) {
      selectedIndex = index
      return
    }
    val clamped = index.coerceIn(0, displayItems().size - 1)
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

  fun setTextColor(color: Int?) {
    textColor = color ?: Color.BLACK
    adapter.textColor = textColor
    adapter.notifyDataSetChanged()
  }

  fun setSelectedTextColor(color: Int?) {
    selectedTextColor = color ?: Color.BLACK
    adapter.selectedTextColor = selectedTextColor
    adapter.notifyDataSetChanged()
  }

  fun setTextSize(size: Float) {
    if (size <= 0f) {
      return
    }
    textSizeSp = size
    adapter.textSizeSp = textSizeSp
    adapter.notifyDataSetChanged()
  }

  fun setSelectedTextSize(size: Float) {
    if (size <= 0f) {
      return
    }
    selectedTextSizeSp = size
    adapter.selectedTextSizeSp = selectedTextSizeSp
    adapter.notifyDataSetChanged()
  }

  private fun applyRecyclerPadding() {
    val verticalPadding = itemHeightPx * ((visibleItemCount - 1) / 2)
    recyclerView.setPadding(0, verticalPadding, 0, verticalPadding)
  }

  private fun scrollToSelectedIndex(animated: Boolean, emit: Boolean) {
    val display = displayItems()
    if (display.isEmpty()) {
      return
    }
    suppressChangeEvent = !emit
    val index = selectedIndex.coerceIn(0, display.size - 1)
    if (animated) {
      recyclerView.smoothScrollToPosition(index)
    } else {
      layoutManager.scrollToPositionWithOffset(index, 0)
      refreshCenterHighlight()
      if (emit) {
        maybeEmitChange(index)
      }
    }
    suppressChangeEvent = false
  }

  private fun updateCenterFromSnap() {
    val centerView = snapHelper.findSnapView(layoutManager) ?: return
    val centerIndex = layoutManager.getPosition(centerView)
    if (centerIndex == RecyclerView.NO_POSITION) {
      return
    }

    selectedIndex = centerIndex
    refreshCenterHighlight()
    maybeEmitChange(centerIndex)
  }

  private fun refreshCenterHighlight() {
    val centerView = snapHelper.findSnapView(layoutManager) ?: return
    val centerIndex = layoutManager.getPosition(centerView)
    if (centerIndex != RecyclerView.NO_POSITION) {
      adapter.centerPosition = centerIndex
    }
  }

  private fun maybeEmitChange(index: Int) {
    val display = displayItems()
    if (suppressChangeEvent || index == lastEmittedIndex || display.isEmpty()) {
      return
    }
    if (index < 0 || index >= display.size) {
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
        display[index],
      ),
    )
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

  companion object {
    private const val TAG = "DrumPicker"
  }
}
