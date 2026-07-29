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
import com.facebook.react.uimanager.events.NativeGestureUtil
import kotlin.math.abs

class DrumPickerView @JvmOverloads constructor(
  context: Context,
  attrs: AttributeSet? = null,
) : FrameLayout(context, attrs) {
  companion object {
    private const val CIRCULAR_MULTIPLIER_SMALL_LIST = 200
    private const val CIRCULAR_MULTIPLIER_LARGE_LIST = 100

    /** Rows an animated jump may traverse before it is shortened into a jump plus a short glide. */
    private const val MAX_ANIMATED_ROWS = 20
  }

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
  private var isCircular = false
  private var circularRealItemCount = 0
  private var scrollAnimatedForNextIndex = false

  private var itemHeightPx = dpToPx(itemHeightDp)
  private var lastHapticIndex = -1
  private var lastChangingIndex = -1
  private var selectionIndicatorHeightPx = dpToPx(selectionIndicatorHeightDp)
  private var lastEmittedIndex = -1
  private var suppressChangeEvent = false
  private var isAttachedToWindow = false
  private var isDisposed = false
  private var styleUpdatePosted = false
  private val minWidthPx = dpToPx(DrumPickerDefaults.MIN_WIDTH_DP)

  /**
   * Last index JS asked for, kept unclamped.
   *
   * Fabric hands props over as an unordered map, so `selectedIndex` can be applied while the
   * previous `items` list is still installed. Clamping the incoming value against that stale list
   * destroys it, which is how a selected year used to drift when the range changed. Keeping the
   * raw request lets [setItemsProp] re-resolve the position against the new list.
   */
  private var requestedSelectedIndex = 0

  /** Centering that could not run yet because the picker has no viewport. */
  private var hasPendingCenterRequest = false
  private var pendingCenterEmitsChange = false

  /**
   * Non-zero while props are being applied. Prop-driven repositioning must never surface as
   * `onChange`, otherwise a controlled parent sees a value it never selected.
   */
  private var programmaticDepth = 0

  /** Set once per touch sequence, when the RecyclerView actually starts scrolling. */
  private var nativeGestureNotified = false
  private var lastDownEvent: MotionEvent? = null

  /**
   * Blocks touch-driven scrolling. Programmatic centering stays available, so a controlled
   * parent can still move the wheel while the user cannot.
   */
  private var isInteractionDisabled = false

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
            notifyNativeGestureStartedIfNeeded()
            // The user has taken the wheel over. Whatever programmatic animation was in flight is
            // no longer responsible for where it lands, so stop suppressing the resulting change.
            suppressChangeEvent = false
            lastChangingIndex = -1
            updateVisibleItemStyles()
          }
          RecyclerView.SCROLL_STATE_SETTLING -> updateVisibleItemStyles()
          RecyclerView.SCROLL_STATE_IDLE -> {
            notifyNativeGestureEndedIfNeeded()
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
              maybeRecenterCircularIfNeeded()
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

    withProgrammaticUpdate {
      recyclerView.stopScroll()
      items = newItems
      circularRealItemCount = resolveCircularRealItemCount(newItems.size)
      adapter.updateItems(newItems)
      lastHapticIndex = -1
      lastChangingIndex = -1

      if (items.isEmpty()) {
        selectedIndex = 0
        lastEmittedIndex = -1
        return@withProgrammaticUpdate
      }

      // Re-resolve against the raw request rather than the current scroll position: the wheel
      // must keep the selected *value*, and `selectedIndex` may have been clamped against the
      // list this update is replacing.
      selectedIndex = requestedSelectedIndex.coerceIn(0, items.size - 1)
      lastEmittedIndex = selectedIndex
      requestCenterOnSelectedIndex(animated = false, emit = false)
    }
  }

  fun setSelectedIndexProp(value: Any?) {
    requestedSelectedIndex = toInt(value, requestedSelectedIndex).coerceAtLeast(0)
    val animated = scrollAnimatedForNextIndex
    scrollAnimatedForNextIndex = false
    withProgrammaticUpdate {
      setSelectedIndex(requestedSelectedIndex, animated = animated)
    }
  }

  fun setScrollAnimatedProp(value: Any?) {
    scrollAnimatedForNextIndex = toBoolean(value, false)
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

  fun setDisabledProp(value: Any?) {
    val disabled = toBoolean(value, false)
    if (isInteractionDisabled == disabled) {
      return
    }
    isInteractionDisabled = disabled
    if (disabled) {
      // A drag may be in flight when the prop flips; drop it rather than letting it settle
      // somewhere the user can no longer correct.
      recyclerView.stopScroll()
    }
  }

  fun setEnableScrollByTapOnItemProp(value: Any?) {
    enableScrollByTapOnItem = toBoolean(value, false)
    adapter.enableScrollByTapOnItem = enableScrollByTapOnItem
  }

  fun setOnValueChangingEnabledProp(value: Any?) {
    val enabled = toBoolean(value, false)
    if (onValueChangingEnabled != enabled) {
      onValueChangingEnabled = enabled
      lastChangingIndex = -1
    }
  }

  fun setCircularProp(value: Any?) {
    isCircular = toBoolean(value, false)
    circularRealItemCount = resolveCircularRealItemCount(items.size)
  }

  private fun scrollToPositionFromTap(position: Int) {
    if (
      isInteractionDisabled ||
      !enableScrollByTapOnItem ||
      !isLifecycleActive() ||
      items.isEmpty()
    ) {
      return
    }
    val clamped = position.coerceIn(0, items.size - 1)
    if (clamped == selectedIndex && clamped == lastEmittedIndex) {
      return
    }
    selectedIndex = clamped
    requestedSelectedIndex = clamped
    requestCenterOnSelectedIndex(animated = true, emit = true)
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
        layoutManager.scrollToPositionWithOffset(
          position,
          centerOffsetForViewport(recyclerView.height),
        )
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

  /** Index of the row actually sitting under the selection indicator. */
  internal fun snapCenterIndexForTesting(): Int = findSnapCenterIndex()

  /** Label of the row actually sitting under the selection indicator. */
  internal fun centeredLabelForTesting(): String? =
    items.getOrNull(findSnapCenterIndex())

  /** How many rows the RecyclerView has laid out — 1 means neighbours are missing. */
  internal fun laidOutRowCountForTesting(): Int = recyclerView.childCount

  /**
   * Observes change events in instrumented tests, where [context] is not a ReactContext and the
   * real event dispatcher is therefore unreachable.
   */
  internal var changeEventListenerForTesting: ((Int) -> Unit)? = null

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
      // New bounds invalidate the offset derived from the previous height. Re-centering targets
      // `selectedIndex`, which tracks whatever the user last scrolled to, so this is idempotent
      // and never overrides a manual choice — unless a drag is in flight, which we leave alone.
      if (recyclerView.scrollState == RecyclerView.SCROLL_STATE_IDLE) {
        hasPendingCenterRequest = true
      }
    }
    // First point at which the viewport height is known. A request parked while the picker was
    // collapsed is flushed here rather than re-posted frame after frame.
    if (hasPendingCenterRequest && height > 0) {
      hasPendingCenterRequest = false
      val emit = pendingCenterEmitsChange
      pendingCenterEmitsChange = false
      centerOnSelectedIndex(animated = false, emit = emit, width = width, height = height)
    }
  }

  override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
    // Intercept before the RecyclerView sees anything, so a disabled wheel neither scrolls nor
    // leaks the gesture to whatever sits behind it.
    if (isInteractionDisabled) {
      return true
    }
    if (ev.actionMasked == MotionEvent.ACTION_DOWN) {
      nativeGestureNotified = false
      lastDownEvent?.recycle()
      lastDownEvent = MotionEvent.obtain(ev)
    }
    return super.onInterceptTouchEvent(ev)
  }

  override fun onTouchEvent(ev: MotionEvent): Boolean =
    if (isInteractionDisabled) true else super.onTouchEvent(ev)

  /**
   * Tells React Native that a native scroll has taken over the touch sequence.
   *
   * Without it the JS responder system keeps competing for the gesture. This matters most inside
   * a React Native `Modal`: `ReactModalHostView.DialogRootViewGroup.requestDisallowInterceptTouchEvent`
   * is an empty method, so the usual "leave my gesture alone" signal is swallowed there and
   * `onChildStartedNativeGesture` is the only channel that still reaches the touch dispatcher.
   */
  private fun notifyNativeGestureStartedIfNeeded() {
    if (nativeGestureNotified) {
      return
    }
    nativeGestureNotified = true
    parent?.requestDisallowInterceptTouchEvent(true)
    val down = lastDownEvent ?: return
    NativeGestureUtil.notifyNativeGestureStarted(this, down)
  }

  /** Hands the touch sequence back once the wheel has settled. */
  private fun notifyNativeGestureEndedIfNeeded() {
    if (!nativeGestureNotified) {
      return
    }
    nativeGestureNotified = false
    val down = lastDownEvent ?: return
    NativeGestureUtil.notifyNativeGestureEnded(this, down)
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
    hasPendingCenterRequest = false
    pendingCenterEmitsChange = false
    nativeGestureNotified = false
    lastDownEvent?.recycle()
    lastDownEvent = null
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

  fun setSelectedIndex(index: Int, animated: Boolean = false) {
    requestedSelectedIndex = index.coerceAtLeast(0)
    if (items.isEmpty()) {
      selectedIndex = requestedSelectedIndex
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
    requestCenterOnSelectedIndex(animated = animated, emit = false)
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
    // Row height feeds the centering offset. The picker's own bounds may well stay the same, so
    // `onLayout` would report `changed == false` and never re-centre on its own.
    requestCenterOnSelectedIndex(animated = false, emit = false)
  }

  fun setVisibleItemCount(count: Int) {
    if (count <= 0 || count == visibleItemCount) {
      return
    }
    visibleItemCount = count
    applyRecyclerPadding()
    updateMinimumDimensions()
    requestLayout()
    requestCenterOnSelectedIndex(animated = false, emit = false)
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

  /** Runs [block] with change events suppressed, so prop updates never look like user input. */
  private inline fun withProgrammaticUpdate(block: () -> Unit) {
    programmaticDepth++
    try {
      block()
    } finally {
      programmaticDepth--
    }
  }

  /**
   * Centers [selectedIndex] as soon as the picker actually has a viewport.
   *
   * The centering offset is derived from the RecyclerView's height, so a request that arrives
   * before the first layout — props are applied before mount, and a collapsed container reports
   * zero height — is parked and flushed from [onLayout], where the real height is known. Nothing
   * is posted, so no frame is spent polling for a size that may take a while to arrive.
   */
  private fun requestCenterOnSelectedIndex(animated: Boolean, emit: Boolean) {
    if (isDisposed || items.isEmpty()) {
      return
    }
    val width = recyclerView.width
    val height = recyclerView.height
    if (width <= 0 || height <= 0) {
      hasPendingCenterRequest = true
      pendingCenterEmitsChange = pendingCenterEmitsChange || emit
      return
    }
    hasPendingCenterRequest = false
    pendingCenterEmitsChange = false
    centerOnSelectedIndex(animated, emit, width, height)
  }

  private fun centerOnSelectedIndex(animated: Boolean, emit: Boolean, width: Int, height: Int) {
    if (isDisposed || items.isEmpty() || height <= 0) {
      return
    }
    val index = selectedIndex.coerceIn(0, items.size - 1)
    if (animated) {
      val current = findSnapCenterIndex()
      if (current == index && recyclerView.scrollState == RecyclerView.SCROLL_STATE_IDLE) {
        // Already under the indicator. Arming suppression here would leave it latched: there is
        // no scroll, so no SCROLL_STATE_IDLE transition would ever come to clear it.
        if (emit) {
          maybeEmitChange(index)
        } else {
          selectedIndex = index
          lastEmittedIndex = index
        }
        return
      }
      suppressChangeEvent = !emit
      // Smooth-scrolling across a long list binds every row in between, which drops frames on a
      // year wheel. Jump to just outside the animation window first and animate only the tail.
      if (current != RecyclerView.NO_POSITION && abs(current - index) > MAX_ANIMATED_ROWS) {
        val approach =
          if (index > current) index - MAX_ANIMATED_ROWS else index + MAX_ANIMATED_ROWS
        applyCenterAnchor(approach.coerceIn(0, items.size - 1), width, height)
      }
      recyclerView.smoothScrollToPosition(index)
      return
    }

    // Guard the synchronous relayout below: it makes the RecyclerView dispatch onScrolled.
    suppressChangeEvent = true
    applyCenterAnchor(index, width, height)
    var snappedIndex = findSnapCenterIndex()
    if (snappedIndex != RecyclerView.NO_POSITION && snappedIndex != index) {
      applyCenterAnchor(index, width, height)
      snappedIndex = findSnapCenterIndex()
    }
    updateVisibleItemStyles()
    suppressChangeEvent = false

    if (emit) {
      maybeEmitChange(if (snappedIndex != RecyclerView.NO_POSITION) snappedIndex else index)
    } else {
      selectedIndex = index
      lastEmittedIndex = index
    }
  }

  /**
   * Anchors [index] to the middle of the viewport and makes the RecyclerView consume the anchor
   * right away.
   *
   * [LinearLayoutManager.scrollToPositionWithOffset] only records the anchor and asks for a new
   * layout pass — which never comes. React Native drives layout from its mounting layer:
   * `ReactViewGroup.requestLayout()` and `ReactViewGroup.onLayout()` are both empty, so a
   * `requestLayout()` from a native child dies at the nearest React parent and no traversal
   * reaches us. Left alone the anchor would sit unused until the next commit, leaving the wheel
   * where it was with only the centre row filled in.
   *
   * Re-running measure/layout on the RecyclerView here both applies the anchor and lets the
   * layout manager fill the viewport, which is what puts the neighbouring rows back.
   * [View.forceLayout] is what makes that possible: [measure] short-circuits on unchanged specs
   * unless the force-layout flag is set, and it would then never reach `onLayoutChildren`, the
   * step that actually consumes the anchor. It is deliberately not `requestLayout()` — that would
   * additionally register a doomed second traversal and log "requestLayout() improperly called
   * during layout" every time this runs from [onLayout].
   */
  private fun applyCenterAnchor(index: Int, width: Int, height: Int) {
    layoutManager.scrollToPositionWithOffset(index, centerOffsetForViewport(height))
    if (recyclerView.isComputingLayout) {
      // The in-flight pass will pick the anchor up; re-entering layout here would throw.
      return
    }
    recyclerView.forceLayout()
    recyclerView.measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY),
    )
    recyclerView.layout(0, 0, width, height)
  }

  /**
   * Offset to pass to [LinearLayoutManager.scrollToPositionWithOffset] so the row lands under the
   * selection indicator.
   *
   * That offset is measured from the layout manager's start *after padding*, not from the top of
   * the view. [applyRecyclerPadding] reserves `itemHeight * (visibleItemCount - 1) / 2` at the
   * top, so an offset computed straight from the viewport centre pushes the anchor that many rows
   * too low — the wheel then shows a row `(visibleItemCount - 1) / 2` earlier than the selected
   * one. Subtracting the padding cancels it out; for the natural height the result is 0.
   *
   * The result may legitimately be negative when the container is shorter than
   * `itemHeight * visibleItemCount`, so it is deliberately not clamped.
   */
  private fun centerOffsetForViewport(height: Int): Int =
    (height - itemHeightPx) / 2 - recyclerView.paddingTop

  private fun updateCenterFromSnap() {
    if (!isLifecycleActive() || items.isEmpty()) {
      return
    }
    val centerIndex = findSnapCenterIndex()
    if (centerIndex == RecyclerView.NO_POSITION) {
      return
    }

    selectedIndex = centerIndex
    // The wheel is the source of truth once the user has spun it: remember this as the intent to
    // restore should `items` be swapped without JS sending a fresh selectedIndex.
    requestedSelectedIndex = centerIndex
    updateVisibleItemStyles()
    maybePerformHaptic(centerIndex)
    maybeEmitChange(centerIndex)
  }

  private fun maybeRecenterCircularIfNeeded() {
    if (!isCircular || !isLifecycleActive() || items.isEmpty()) {
      return
    }
    val realCount = circularRealItemCount
    if (realCount <= 1) {
      return
    }
    val totalItems = items.size
    if (totalItems <= realCount) {
      return
    }
    val centerIndex = findSnapCenterIndex()
    if (centerIndex == RecyclerView.NO_POSITION) {
      return
    }
    val threshold = totalItems / 4
    if (centerIndex >= threshold && centerIndex <= totalItems - threshold) {
      return
    }
    val realIndex = ((centerIndex % realCount) + realCount) % realCount
    val centerBase = (totalItems / 2 / realCount) * realCount
    val centerVirtual = centerBase + realIndex
    if (centerVirtual == centerIndex) {
      return
    }
    if (recyclerView.height <= 0 || recyclerView.width <= 0) {
      recyclerView.scrollToPosition(centerVirtual)
    } else {
      applyCenterAnchor(centerVirtual, recyclerView.width, recyclerView.height)
    }
    selectedIndex = centerVirtual
    requestedSelectedIndex = centerVirtual
    lastEmittedIndex = centerVirtual
    lastChangingIndex = centerVirtual
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
      programmaticDepth > 0 ||
      items.isEmpty()
    ) {
      return
    }
    val centerIndex = findSnapCenterIndex()
    if (centerIndex == RecyclerView.NO_POSITION || centerIndex == lastChangingIndex) {
      return
    }
    if (centerIndex !in items.indices) {
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
    if (!isLifecycleActive() || suppressChangeEvent || programmaticDepth > 0 || items.isEmpty()) {
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
    changeEventListenerForTesting?.invoke(clamped)

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

  private fun resolveCircularRealItemCount(totalCount: Int): Int {
    if (!isCircular || totalCount <= 1) {
      return totalCount
    }
    if (totalCount % CIRCULAR_MULTIPLIER_SMALL_LIST == 0) {
      val real = totalCount / CIRCULAR_MULTIPLIER_SMALL_LIST
      if (real in 2..100) {
        return real
      }
    }
    if (totalCount % CIRCULAR_MULTIPLIER_LARGE_LIST == 0) {
      val real = totalCount / CIRCULAR_MULTIPLIER_LARGE_LIST
      if (real > 1) {
        return real
      }
    }
    return totalCount
  }
}
