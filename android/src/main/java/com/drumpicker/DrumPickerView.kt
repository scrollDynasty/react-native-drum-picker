package com.drumpicker

import android.content.Context
import android.graphics.Color
import android.os.Build
import android.view.HapticFeedbackConstants
import android.util.AttributeSet
import android.os.SystemClock
import android.view.MotionEvent
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
import com.facebook.react.uimanager.common.UIManagerType
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
  private var backgroundColor = DrumPickerDefaults.TRANSPARENT
  private var containerBackgroundColor = DrumPickerDefaults.TRANSPARENT
  private var itemBackgroundColor = DrumPickerDefaults.TRANSPARENT
  private var hapticFeedback = false
  private var enableScrollByTapOnItem = false
  private var onValueChangingEnabled = false

  private var itemHeightPx = dpToPx(itemHeightDp)
  private var lastHapticIndex = -1
  private var lastChangingIndex = -1
  private var selectionIndicatorHeightPx = dpToPx(selectionIndicatorHeightDp)
  private var lastEmittedIndex = -1
  private var suppressChangeEvent = false
  private var isAttachedToWindow = false
  private var isDisposed = false
  private var styleUpdatePosted = false
  private var pendingScrollRunnable: Runnable? = null
  private val minWidthPx = dpToPx(DrumPickerDefaults.MIN_WIDTH_DP)

  private val styleUpdateRunnable =
    Runnable {
      styleUpdatePosted = false
      if (isLifecycleActive()) {
        updateVisibleItemStyles()
      }
    }

  private val scrollListener =
    object : RecyclerView.OnScrollListener() {
      override fun onScrolled(recyclerView: RecyclerView, dx: Int, dy: Int) {
        if (!isLifecycleActive()) {
          return
        }
        scheduleVisibleItemStyleUpdate()
        maybeEmitValueChanging()
      }

      override fun onScrollStateChanged(recyclerView: RecyclerView, newState: Int) {
        if (!isLifecycleActive()) {
          return
        }
        when (newState) {
          RecyclerView.SCROLL_STATE_DRAGGING -> {
            lastChangingIndex = -1
            updateVisibleItemStyles()
          }
          RecyclerView.SCROLL_STATE_SETTLING -> updateVisibleItemStyles()
          RecyclerView.SCROLL_STATE_IDLE -> {
            updateVisibleItemStyles()
            if (suppressChangeEvent) {
              val centerIndex = findSnapCenterIndex()
              if (centerIndex != RecyclerView.NO_POSITION) {
                selectedIndex = centerIndex
                lastEmittedIndex = centerIndex
              }
              suppressChangeEvent = false
            } else {
              updateCenterFromSnap()
            }
          }
        }
      }
    }

  init {
    setBackgroundColor(DrumPickerDefaults.TRANSPARENT)
    recyclerView.setBackgroundColor(DrumPickerDefaults.TRANSPARENT)
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

    adapter.distanceForPosition = { position -> distanceFromCenterForPosition(position) }
    adapter.onItemTap = { position -> scrollToPositionFromTap(position) }
    syncAdapterStyle()
    applyBackgroundColors()
    applyRecyclerPadding()
    updateIndicatorAppearance()
    updateMinimumDimensions()
  }

  fun setItemsProp(value: Any?) {
    val newItems = parseItems(value)
    if (itemsContentEquals(newItems, items)) {
      return
    }

    recyclerView.stopScroll()
    items = newItems
    adapter.updateItems(newItems)
    lastEmittedIndex = -1
    lastHapticIndex = -1
    lastChangingIndex = -1

    if (items.isEmpty()) {
      selectedIndex = selectedIndex.coerceAtLeast(0)
      return
    }

    selectedIndex = selectedIndex.coerceIn(0, items.size - 1)
    runWhenAttached { scheduleScrollToSelectedIndexCentered(animated = false, emit = false) }
  }

  fun setSelectedIndexProp(value: Any?) {
    val index = toInt(value, selectedIndex)
    val safeIndex =
      if (items.isEmpty()) {
        index.coerceAtLeast(0)
      } else {
        index.coerceIn(0, items.size - 1)
      }
    setSelectedIndex(safeIndex)
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

  fun setBackgroundColorProp(value: Any?) {
    backgroundColor = resolveBackgroundColor(value, backgroundColor)
    applyBackgroundColors()
  }

  fun setContainerBackgroundColorProp(value: Any?) {
    containerBackgroundColor = resolveBackgroundColor(value, containerBackgroundColor)
    applyBackgroundColors()
  }

  fun setItemBackgroundColorProp(value: Any?) {
    itemBackgroundColor = resolveBackgroundColor(value, itemBackgroundColor)
    applyBackgroundColors()
  }

  fun setHapticFeedbackProp(value: Any?) {
    hapticFeedback = value as? Boolean ?: false
  }

  fun setEnableScrollByTapOnItemProp(value: Any?) {
    enableScrollByTapOnItem = toBoolean(value, false)
    adapter.enableScrollByTapOnItem = enableScrollByTapOnItem
  }

  fun setOnValueChangingEnabledProp(value: Any?) {
    onValueChangingEnabled = toBoolean(value, false)
  }

  private fun scrollToPositionFromTap(position: Int) {
    if (!enableScrollByTapOnItem || !isLifecycleActive() || items.isEmpty()) {
      return
    }
    val clamped = position.coerceIn(0, items.size - 1)
    if (clamped == selectedIndex && clamped == lastEmittedIndex) {
      return
    }
    selectedIndex = clamped
    scheduleScrollToSelectedIndexCentered(animated = true, emit = true)
  }

  /** @see selectedIndexForTesting — instrumented tests only */
  internal fun testingPerformItemTap(position: Int) {
    scrollToPositionFromTap(position)
  }

  /** Dispatches a tap on the row view for instrumented tests (real touch pipeline). */
  internal fun testingClickRow(position: Int) {
    val holder = recyclerView.findViewHolderForAdapterPosition(position)
    if (holder == null) {
      if (recyclerView.height > 0) {
        val centerOffset = ((recyclerView.height - itemHeightPx) / 2).coerceAtLeast(0)
        layoutManager.scrollToPositionWithOffset(position, centerOffset)
      } else {
        layoutManager.scrollToPosition(position)
      }
      recyclerView.post { testingClickRow(position) }
      return
    }
    val view = holder.itemView
    val downTime = SystemClock.uptimeMillis()
    val x = view.width / 2f
    val y = view.height / 2f
    val down =
      MotionEvent.obtain(downTime, downTime, MotionEvent.ACTION_DOWN, x, y, 0)
    val up =
      MotionEvent.obtain(
        downTime,
        downTime + 50,
        MotionEvent.ACTION_UP,
        x,
        y,
        0,
      )
    view.dispatchTouchEvent(down)
    view.dispatchTouchEvent(up)
    down.recycle()
    up.recycle()
  }

  internal fun selectedIndexForTesting(): Int = selectedIndex

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    updateMinimumDimensions()
    val width = resolveSize(minWidthPx, widthMeasureSpec)
    val safeVisibleCount = visibleItemCount.coerceAtLeast(1)
    val defaultHeight = itemHeightPx * safeVisibleCount
    val height = resolveSize(defaultHeight, heightMeasureSpec)

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
      runWhenAttached { scheduleScrollToSelectedIndexCentered(animated = false, emit = false) }
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    isAttachedToWindow = true
    isDisposed = false
    suppressChangeEvent = false
    recyclerView.removeOnScrollListener(scrollListener)
    recyclerView.addOnScrollListener(scrollListener)
  }

  override fun onDetachedFromWindow() {
    isAttachedToWindow = false
    isDisposed = true
    suppressChangeEvent = false
    styleUpdatePosted = false
    cancelPendingScroll()
    recyclerView.stopScroll()
    recyclerView.removeCallbacks(styleUpdateRunnable)
    removeCallbacks(null)
    recyclerView.removeCallbacks(null)
    recyclerView.removeOnScrollListener(scrollListener)
    // Do not null adapter or detach SnapHelper here — react-native-screens may
    // detach during transitions while RecyclerView is still laying out/scrolling.
    super.onDetachedFromWindow()
  }

  private fun isLifecycleActive(): Boolean = isAttachedToWindow && !isDisposed

  fun setSelectedIndex(index: Int) {
    if (items.isEmpty()) {
      selectedIndex = index.coerceAtLeast(0)
      return
    }
    val clamped = index.coerceIn(0, items.size - 1)
    val snapIndex = findSnapCenterIndex()
    val isAlreadyCentered =
      clamped == selectedIndex &&
        snapIndex == clamped &&
        recyclerView.scrollState == RecyclerView.SCROLL_STATE_IDLE
    if (isAlreadyCentered) {
      return
    }
    selectedIndex = clamped
    scheduleScrollToSelectedIndexCentered(animated = false, emit = false)
  }

  fun setItemHeight(height: Float) {
    if (height <= 0f || height == itemHeightDp) {
      return
    }
    itemHeightDp = height
    itemHeightPx = dpToPx(itemHeightDp)
    adapter.itemHeightPx = itemHeightPx
    adapter.notifyRowMetricsChanged()
    applyRecyclerPadding()
    updateMinimumDimensions()
    requestLayout()
  }

  fun setVisibleItemCount(count: Int) {
    if (count <= 0 || count == visibleItemCount) {
      return
    }
    visibleItemCount = count
    applyRecyclerPadding()
    updateMinimumDimensions()
    requestLayout()
  }

  private fun updateMinimumDimensions() {
    val safeVisibleCount = visibleItemCount.coerceAtLeast(1)
    minimumHeight = itemHeightPx * safeVisibleCount
    minimumWidth = minWidthPx
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
    adapter.itemBackgroundColor = itemBackgroundColor
    resetVisibleStyleBuckets()
  }

  private fun applyBackgroundColors() {
    setBackgroundColor(backgroundColor)
    recyclerView.setBackgroundColor(containerBackgroundColor)
    adapter.itemBackgroundColor = itemBackgroundColor
    if (adapter.itemCount > 0) {
      adapter.notifyRowMetricsChanged()
    }
  }

  private fun resetVisibleStyleBuckets() {
    for (i in 0 until recyclerView.childCount) {
      val holder =
        recyclerView.getChildViewHolder(recyclerView.getChildAt(i))
          as? DrumPickerAdapter.ItemViewHolder ?: continue
      holder.lastStyleBucket = Int.MIN_VALUE
    }
  }

  private fun applyRecyclerPadding() {
    val verticalPadding = (itemHeightPx * (visibleItemCount - 1)) / 2
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

  private fun scheduleScrollToSelectedIndexCentered(animated: Boolean, emit: Boolean) {
    if (!isLifecycleActive() || items.isEmpty()) {
      return
    }
    cancelPendingScroll()
    val runnable =
      Runnable {
        pendingScrollRunnable = null
        if (!isLifecycleActive()) {
          return@Runnable
        }
        scrollToSelectedIndexCentered(animated, emit)
      }
    pendingScrollRunnable = runnable
    if (recyclerView.height > 0) {
      recyclerView.post(runnable)
    } else {
      post(runnable)
    }
  }

  private fun cancelPendingScroll() {
    pendingScrollRunnable?.let { pending ->
      recyclerView.removeCallbacks(pending)
      removeCallbacks(pending)
    }
    pendingScrollRunnable = null
  }

  private fun scrollToSelectedIndexCentered(animated: Boolean, emit: Boolean) {
    if (!isLifecycleActive() || items.isEmpty()) {
      return
    }
    suppressChangeEvent = !emit
    val index = selectedIndex.coerceIn(0, items.size - 1)
    if (animated) {
      recyclerView.smoothScrollToPosition(index)
      return
    }

    if (recyclerView.height <= 0) {
      scheduleScrollToSelectedIndexCentered(animated = false, emit = emit)
      return
    }

    val centerOffset = ((recyclerView.height - itemHeightPx) / 2).coerceAtLeast(0)
    layoutManager.scrollToPositionWithOffset(index, centerOffset)
    recyclerView.post {
      if (!isLifecycleActive()) {
        return@post
      }
      var snappedIndex = findSnapCenterIndex()
      if (snappedIndex != RecyclerView.NO_POSITION && snappedIndex != index) {
        layoutManager.scrollToPositionWithOffset(index, centerOffset)
        snappedIndex = findSnapCenterIndex()
      }
      updateVisibleItemStyles()
      val resolvedIndex =
        if (emit && snappedIndex != RecyclerView.NO_POSITION) snappedIndex else index
      if (emit) {
        maybeEmitChange(resolvedIndex)
      } else {
        lastEmittedIndex = index
        selectedIndex = index
      }
      suppressChangeEvent = false
    }
  }

  private fun runWhenAttached(block: () -> Unit) {
    if (!isLifecycleActive()) {
      return
    }
    post {
      if (!isLifecycleActive()) {
        return@post
      }
      block()
    }
  }

  private fun updateCenterFromSnap() {
    if (!isLifecycleActive() || items.isEmpty()) {
      return
    }
    val centerIndex = findSnapCenterIndex()
    if (centerIndex == RecyclerView.NO_POSITION) {
      return
    }

    selectedIndex = centerIndex
    updateVisibleItemStyles()
    maybePerformHaptic(centerIndex)
    maybeEmitChange(centerIndex)
  }

  private fun maybePerformHaptic(index: Int) {
    if (!hapticFeedback || !isLifecycleActive() || index < 0) {
      return
    }
    if (index == lastHapticIndex) {
      return
    }
    lastHapticIndex = index
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      performHapticFeedback(HapticFeedbackConstants.TEXT_HANDLE_MOVE)
    } else {
      performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
    }
  }

  private fun findSnapCenterIndex(): Int {
    if (items.isEmpty()) {
      return RecyclerView.NO_POSITION
    }
    val centerView = snapHelper.findSnapView(layoutManager) ?: return RecyclerView.NO_POSITION
    return layoutManager.getPosition(centerView)
  }

  private fun scheduleVisibleItemStyleUpdate() {
    if (styleUpdatePosted || !isLifecycleActive()) {
      return
    }
    styleUpdatePosted = true
    recyclerView.postOnAnimation(styleUpdateRunnable)
  }

  private fun distanceFromCenterForPosition(position: Int): Float {
    if (itemHeightPx <= 0 || recyclerView.height == 0) {
      return 2f
    }
    val child = layoutManager.findViewByPosition(position) ?: return 2f
    val pickerCenterY = recyclerView.height / 2f
    val childCenterY = child.top + child.height / 2f
    return abs(childCenterY - pickerCenterY) / itemHeightPx.toFloat()
  }

  private fun updateVisibleItemStyles() {
    if (!isLifecycleActive() || recyclerView.height == 0 || itemHeightPx <= 0) {
      return
    }

    val pickerCenterY = recyclerView.height / 2f
    val rowHeight = itemHeightPx.toFloat()
    for (i in 0 until recyclerView.childCount) {
      val child = recyclerView.getChildAt(i)
      val holder = recyclerView.getChildViewHolder(child) as? DrumPickerAdapter.ItemViewHolder
        ?: continue
      val childCenterY = child.top + child.height / 2f
      val distance = abs(childCenterY - pickerCenterY) / rowHeight
      adapter.applyItemStyle(holder, distance)
    }
  }

  private fun maybeEmitValueChanging() {
    if (
      !onValueChangingEnabled ||
      !isLifecycleActive() ||
      suppressChangeEvent ||
      items.isEmpty()
    ) {
      return
    }
    val centerIndex = findSnapCenterIndex()
    if (centerIndex == RecyclerView.NO_POSITION || centerIndex == lastChangingIndex) {
      return
    }
    lastChangingIndex = centerIndex
    val value = items[centerIndex]

    val reactContext = context as? ReactContext ?: return
    if (!reactContext.hasActiveReactInstance()) {
      return
    }
    @Suppress("DEPRECATION")
    val dispatcher: EventDispatcher? =
      UIManagerHelper.getEventDispatcher(reactContext, UIManagerType.FABRIC)
    dispatcher?.dispatchEvent(
      DrumPickerValueChangingEvent(
        UIManagerHelper.getSurfaceId(reactContext),
        id,
        centerIndex,
        value,
      ),
    )
  }

  private fun maybeEmitChange(index: Int) {
    if (!isLifecycleActive() || suppressChangeEvent || items.isEmpty()) {
      return
    }
    if (index < 0 || index >= items.size) {
      return
    }
    val clamped = index.coerceIn(0, items.size - 1)
    if (clamped == lastEmittedIndex) {
      selectedIndex = clamped
      return
    }

    lastEmittedIndex = clamped
    selectedIndex = clamped

    val reactContext = context as? ReactContext ?: return
    if (!reactContext.hasActiveReactInstance()) {
      return
    }
    // Fabric-only: pass UIManagerType.FABRIC for RN 0.81–0.84; deprecated but still required there.
    @Suppress("DEPRECATION")
    val dispatcher: EventDispatcher? =
      UIManagerHelper.getEventDispatcher(reactContext, UIManagerType.FABRIC)
    dispatcher?.dispatchEvent(
      DrumPickerChangeEvent(
        UIManagerHelper.getSurfaceId(reactContext),
        id,
        clamped,
        items[clamped],
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

  private fun resolveBackgroundColor(value: Any?, fallback: Int): Int {
    if (value == null) {
      return fallback
    }
    if (value is String && value.equals("transparent", ignoreCase = true)) {
      return Color.TRANSPARENT
    }
    return resolveColor(value, fallback)
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

  private fun itemsContentEquals(a: List<String>, b: List<String>): Boolean {
    if (a === b) {
      return true
    }
    if (a.size != b.size) {
      return false
    }
    for (i in a.indices) {
      if (a[i] != b[i]) {
        return false
      }
    }
    return true
  }
}
