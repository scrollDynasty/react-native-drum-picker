package com.drumpicker

import android.content.Context
import android.graphics.Color
import android.util.AttributeSet
import android.widget.FrameLayout
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.LinearSnapHelper
import androidx.recyclerview.widget.RecyclerView
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableArray
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
  private var textColor = Color.parseColor("#9CA3AF")
  private var selectedTextColor = Color.parseColor("#111827")
  private var textSizeSp = 18f
  private var selectedTextSizeSp = 22f

  private var itemHeightPx = dpToPx(itemHeightDp)
  private var lastEmittedIndex = -1
  private var suppressChangeEvent = false

  init {
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

    applyRecyclerPadding()
    post { scrollToSelectedIndex(animated = false, emit = false) }
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
    recyclerView.layout(0, 0, right - left, bottom - top)
    if (changed) {
      applyRecyclerPadding()
      post { scrollToSelectedIndex(animated = false, emit = false) }
    }
  }

  fun setItems(value: ReadableArray?) {
    items =
      if (value == null) {
        emptyList()
      } else {
        buildList(value.size()) { for (i in 0 until value.size()) add(value.getString(i) ?: "") }
      }
    adapter.items = items
    val clamped = selectedIndex.coerceIn(0, (items.size - 1).coerceAtLeast(0))
    if (clamped != selectedIndex) {
      selectedIndex = clamped
    }
    post { scrollToSelectedIndex(animated = false, emit = false) }
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

  fun setTextColor(color: Int?) {
    textColor = color ?: Color.GRAY
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
    if (items.isEmpty()) {
      return
    }
    suppressChangeEvent = !emit
    val index = selectedIndex.coerceIn(0, items.size - 1)
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

  private fun dpToPx(dp: Float): Int =
    (dp * resources.displayMetrics.density + 0.5f).toInt()
}
