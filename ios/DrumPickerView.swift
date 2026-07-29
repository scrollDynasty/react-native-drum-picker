import UIKit

@objc public protocol DrumPickerWheelViewDelegate: NSObjectProtocol {
  func drumPickerWheelView(
    _ view: DrumPickerWheelView,
    didSelectRow row: Int,
    value: String,
    userInitiated: Bool
  )

  @objc optional func drumPickerWheelView(
    _ view: DrumPickerWheelView,
    isChangingToIndex row: Int,
    value: String
  )
}

private enum DrumPickerDefaults {
  static let itemHeight: CGFloat = 44
  static let visibleItemCount: Int = 5
  static let textSize: CGFloat = 20
  static let selectedTextSize: CGFloat = 22
  static let textColor = UIColor(red: 0.556, green: 0.556, blue: 0.576, alpha: 1)
  static let selectedTextColor = UIColor(red: 0.110, green: 0.110, blue: 0.118, alpha: 1)
  static let indicatorColor = UIColor(red: 0.820, green: 0.820, blue: 0.839, alpha: 1)
  static let indicatorHeight: CGFloat = 1
  static let circularMultiplierSmallList = 200
  static let circularMultiplierLargeList = 100
}

@objc(DrumPickerWheelView)
public final class DrumPickerWheelView: UIView, UIPickerViewDataSource, UIPickerViewDelegate {
  @objc public weak var wheelDelegate: DrumPickerWheelViewDelegate?

  private let picker = UIPickerView()
  private let topIndicator = UIView()
  private let bottomIndicator = UIView()
  private var selectionGenerator: UISelectionFeedbackGenerator?
  private weak var pickerScrollView: UIScrollView?
  private var scrollOffsetObservation: NSKeyValueObservation?

  private var items: [String] = []
  private var selectedIndex: Int = 0

  /// Last index JS asked for, kept unclamped so `setItems` can re-resolve the *value* rather than
  /// preserving the scroll position. Mirrors `requestedSelectedIndex` on Android.
  private var requestedSelectedIndex: Int = 0
  private var suppressSelectionEvents = false
  private var isProgrammaticSelection = false
  private var lastSelectedIndex = -1
  private var lastChangingIndex = -1

  private var itemHeight: CGFloat = DrumPickerDefaults.itemHeight
  private var visibleItemCount: Int = DrumPickerDefaults.visibleItemCount
  private var textColor: UIColor = DrumPickerDefaults.textColor
  private var selectedTextColor: UIColor = DrumPickerDefaults.selectedTextColor
  private var textSize: CGFloat = DrumPickerDefaults.textSize
  private var selectedTextSize: CGFloat = DrumPickerDefaults.selectedTextSize
  private var showSelectionIndicator = true
  private var selectionIndicatorColor: UIColor = DrumPickerDefaults.indicatorColor
  private var selectionIndicatorHeight: CGFloat = DrumPickerDefaults.indicatorHeight
  private var itemBackgroundColor: UIColor = .clear
  private var hapticFeedback = false
  private var enableScrollByTapOnItem = false
  private var onValueChangingEnabled = false
  @objc public var isCircular: Bool = false {
    didSet {
      circularRealItemCount = resolveCircularRealItemCount(totalCount: items.count)
      picker.reloadAllComponents()
      if isCircular {
        centerToVirtualMiddle(animated: false)
      }
    }
  }
  private var circularRealItemCount: Int = 0

  public override init(frame: CGRect) {
    super.init(frame: frame)
    commonInit()
  }

  public required init?(coder: NSCoder) {
    super.init(coder: coder)
    commonInit()
  }

  private func commonInit() {
    backgroundColor = .clear
    picker.dataSource = self
    picker.delegate = self
    picker.backgroundColor = .clear
    picker.showsSelectionIndicator = false

    topIndicator.isUserInteractionEnabled = false
    bottomIndicator.isUserInteractionEnabled = false

    addSubview(picker)
    addSubview(topIndicator)
    addSubview(bottomIndicator)

    updatePickerFrame()
    updateIndicators()
    setupTapGesture()
  }

  private func setupTapGesture() {
    let tap = UITapGestureRecognizer(target: self, action: #selector(handlePickerTap(_:)))
    tap.cancelsTouchesInView = false
    picker.addGestureRecognizer(tap)
  }

  @objc private func handlePickerTap(_ gesture: UITapGestureRecognizer) {
    guard enableScrollByTapOnItem, !items.isEmpty else { return }
    let location = gesture.location(in: picker)
    let row = rowAtTapLocation(location)
    guard row >= 0, row < items.count else { return }
    applySelectedIndex(row, animated: true, userInitiated: true)
  }

  private func rowAtTapLocation(_ point: CGPoint) -> Int {
    guard itemHeight > 0, !items.isEmpty else { return 0 }
    if let hitRow = rowFromVisibleLabelHitTest(at: point) {
      return hitRow
    }
    let currentRow = picker.selectedRow(inComponent: 0)
    let centerY = picker.bounds.midY
    let deltaRows = Int(round((point.y - centerY) / itemHeight))
    return min(max(currentRow + deltaRows, 0), items.count - 1)
  }

  private func rowFromVisibleLabelHitTest(at point: CGPoint) -> Int? {
    findRowLabel(in: picker, at: point)
  }

  private func findRowLabel(in view: UIView, at pointInPicker: CGPoint) -> Int? {
    for child in view.subviews {
      let local = picker.convert(pointInPicker, to: child)
      guard child.bounds.contains(local) else { continue }
      if let label = child as? UILabel,
         let text = label.text,
         !text.isEmpty,
         let index = items.firstIndex(of: text) {
        return index
      }
      if let nested = findRowLabel(in: child, at: pointInPicker) {
        return nested
      }
    }
    return nil
  }

  /// Used by unit tests to assert tap-to-scroll selection without UIKit gesture plumbing.
  internal func testingTap(at point: CGPoint) {
    guard enableScrollByTapOnItem, !items.isEmpty else { return }
    let row = rowAtTapLocation(point)
    guard row >= 0, row < items.count else { return }
    applySelectedIndex(row, animated: false, userInitiated: true)
  }

  internal func selectedIndexForTesting() -> Int {
    selectedIndex
  }

  public override func didMoveToWindow() {
    super.didMoveToWindow()
    attachPickerScrollViewIfNeeded()
    attachScrollChangingObserverIfNeeded()
  }

  public override var accessibilityIdentifier: String? {
    didSet {
      picker.accessibilityIdentifier = accessibilityIdentifier
    }
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    updatePickerFrame()
    updateIndicators()
    attachPickerScrollViewIfNeeded()
    reapplySelectionIfDrifted()
    if picker.accessibilityIdentifier != accessibilityIdentifier {
      picker.accessibilityIdentifier = accessibilityIdentifier
    }
  }

  /// Re-centres the wheel once the view finally has a size.
  ///
  /// Mounting inside a collapsed container means `selectRow` runs against a zero-height picker;
  /// UIKit can drop that selection when the real frame arrives. Reasserting it on layout is
  /// idempotent — `selectedIndex` tracks whatever the user last spun to — and is the iOS
  /// counterpart of the pending-centre flush Android does in `onLayout`.
  private func reapplySelectionIfDrifted() {
    guard !items.isEmpty, bounds.height > 0 else { return }
    let target = min(max(selectedIndex, 0), items.count - 1)
    guard picker.selectedRow(inComponent: 0) != target else { return }
    performProgrammaticUpdate {
      self.picker.selectRow(target, inComponent: 0, animated: false)
      self.lastSelectedIndex = target
    }
  }

  private func attachPickerScrollViewIfNeeded() {
    guard pickerScrollView == nil else { return }
    for subview in picker.subviews {
      guard let scrollView = subview as? UIScrollView else { continue }
      pickerScrollView = scrollView
      scrollView.panGestureRecognizer.addTarget(
        self,
        action: #selector(handlePickerPanBegan(_:))
      )
      attachScrollChangingObserverIfNeeded()
      break
    }
  }

  private func attachScrollChangingObserverIfNeeded() {
    guard onValueChangingEnabled, scrollOffsetObservation == nil else { return }
    guard let scrollView = pickerScrollView else { return }
    scrollOffsetObservation = scrollView.observe(\.contentOffset, options: [.new]) {
      [weak self] _, _ in
      self?.handlePickerScrollChanged()
    }
  }

  private func detachScrollChangingObserver() {
    scrollOffsetObservation?.invalidate()
    scrollOffsetObservation = nil
  }

  private func handlePickerScrollChanged() {
    guard onValueChangingEnabled, !suppressSelectionEvents, !isProgrammaticSelection else {
      return
    }
    guard !items.isEmpty, pickerScrollView != nil else { return }

    let row = picker.selectedRow(inComponent: 0)
    let clamped = min(max(row, 0), items.count - 1)
    guard clamped != lastChangingIndex else { return }

    lastChangingIndex = clamped
    wheelDelegate?.drumPickerWheelView?(
      self,
      isChangingToIndex: clamped,
      value: items[clamped]
    )
  }

  @objc private func handlePickerPanBegan(_ recognizer: UIGestureRecognizer) {
    guard recognizer.state == .began else { return }
    if onValueChangingEnabled {
      lastChangingIndex = -1
    }
    guard hapticFeedback else { return }
    ensureSelectionGenerator()
  }

  private func updatePickerFrame() {
    let height = itemHeight * CGFloat(max(visibleItemCount, 1))
    picker.frame = CGRect(x: 0, y: 0, width: bounds.width, height: height)
    picker.center = CGPoint(x: bounds.midX, y: bounds.midY)
  }

  private func updateIndicators() {
    let show = showSelectionIndicator && selectionIndicatorHeight > 0
    topIndicator.isHidden = !show
    bottomIndicator.isHidden = !show
    topIndicator.backgroundColor = selectionIndicatorColor
    bottomIndicator.backgroundColor = selectionIndicatorColor

    let centerY = picker.frame.midY
    let halfBand = itemHeight / 2
    let indicatorH = selectionIndicatorHeight
    topIndicator.frame = CGRect(
      x: picker.frame.minX,
      y: centerY - halfBand - indicatorH,
      width: picker.frame.width,
      height: indicatorH
    )
    bottomIndicator.frame = CGRect(
      x: picker.frame.minX,
      y: centerY + halfBand,
      width: picker.frame.width,
      height: indicatorH
    )
  }

  @objc public func setItems(_ items: [String]) {
    self.items = items
    circularRealItemCount = resolveCircularRealItemCount(totalCount: items.count)
    lastChangingIndex = -1
    performProgrammaticUpdate {
      self.picker.reloadAllComponents()
      guard !self.items.isEmpty else {
        self.selectedIndex = 0
        self.lastSelectedIndex = -1
        return
      }
      // Re-resolve from the raw request, not from where the wheel currently sits: a list swap
      // must keep the selected value even when the index was clamped against the old list.
      let clamped = min(max(self.requestedSelectedIndex, 0), self.items.count - 1)
      self.selectedIndex = clamped
      self.picker.selectRow(clamped, inComponent: 0, animated: false)
      self.lastSelectedIndex = clamped
    }
    if isCircular {
      centerToVirtualMiddle(animated: false)
    }
  }

  @objc public func setSelectedIndex(_ index: Int, animated: Bool) {
    requestedSelectedIndex = max(index, 0)
    applySelectedIndex(index, animated: animated, userInitiated: false)
  }

  @objc public func setItemHeight(_ value: CGFloat) {
    itemHeight = max(1, value)
    invalidateIntrinsicContentSize()
    setNeedsLayout()
    picker.reloadAllComponents()
  }

  @objc public func setVisibleItemCount(_ value: Int) {
    visibleItemCount = max(1, value)
    invalidateIntrinsicContentSize()
    setNeedsLayout()
  }

  @objc public func setTextColor(_ color: UIColor) {
    textColor = color
    picker.reloadComponent(0)
  }

  @objc public func setSelectedTextColor(_ color: UIColor) {
    selectedTextColor = color
    picker.reloadComponent(0)
  }

  @objc public func setTextSize(_ value: CGFloat) {
    textSize = max(1, value)
    picker.reloadComponent(0)
  }

  @objc public func setSelectedTextSize(_ value: CGFloat) {
    selectedTextSize = max(1, value)
    picker.reloadComponent(0)
  }

  @objc public func setShowSelectionIndicator(_ value: Bool) {
    showSelectionIndicator = value
    updateIndicators()
  }

  @objc public func setSelectionIndicatorColor(_ color: UIColor) {
    selectionIndicatorColor = color
    updateIndicators()
  }

  @objc public func setSelectionIndicatorHeight(_ value: CGFloat) {
    selectionIndicatorHeight = max(0, value)
    updateIndicators()
  }

  @objc public func setItemBackgroundColor(_ color: UIColor) {
    itemBackgroundColor = color
    picker.reloadComponent(0)
  }

  /// UIPickerView has no separate container layer — applied to this UIView's background.
  @objc public func setContainerBackgroundColor(_ color: UIColor) {
    backgroundColor = color
  }

  @objc public func setPickerBackgroundColor(_ color: UIColor) {
    picker.backgroundColor = color
  }

  @objc public func setHapticFeedback(_ value: Bool) {
    hapticFeedback = value
    if value {
      ensureSelectionGenerator()
    }
  }

  @objc public func setEnableScrollByTapOnItem(_ value: Bool) {
    enableScrollByTapOnItem = value
  }

  /// Blocks touch-driven scrolling. `setSelectedIndex(_:animated:)` keeps working, so a
  /// controlled parent can still move the wheel while the user cannot.
  @objc public func setDisabled(_ value: Bool) {
    picker.isUserInteractionEnabled = !value
  }

  @objc public func setOnValueChangingEnabled(_ value: Bool) {
    onValueChangingEnabled = value
    if value {
      attachPickerScrollViewIfNeeded()
      attachScrollChangingObserverIfNeeded()
    } else {
      lastChangingIndex = -1
      detachScrollChangingObserver()
    }
  }

  deinit {
    detachScrollChangingObserver()
  }

  public override var intrinsicContentSize: CGSize {
    CGSize(width: UIView.noIntrinsicMetric, height: itemHeight * CGFloat(max(visibleItemCount, 1)))
  }

  private func performProgrammaticUpdate(_ block: () -> Void) {
    isProgrammaticSelection = true
    suppressSelectionEvents = true
    block()
    suppressSelectionEvents = false
    DispatchQueue.main.async {
      self.isProgrammaticSelection = false
    }
  }

  private func applySelectedIndex(
    _ index: Int,
    animated: Bool = false,
    userInitiated: Bool = false
  ) {
    guard !items.isEmpty else {
      selectedIndex = 0
      lastSelectedIndex = -1
      return
    }

    let clamped = min(max(index, 0), items.count - 1)
    selectedIndex = clamped

    if userInitiated {
      if clamped == lastSelectedIndex {
        return
      }
      requestedSelectedIndex = clamped
      picker.selectRow(clamped, inComponent: 0, animated: animated)
      lastSelectedIndex = clamped
      notifySelection(row: clamped, userInitiated: true)
      return
    }

    performProgrammaticUpdate {
      self.picker.selectRow(clamped, inComponent: 0, animated: animated)
      self.picker.reloadAllComponents()
      self.lastSelectedIndex = clamped
    }
  }

  private func notifySelection(row: Int, userInitiated: Bool) {
    guard row >= 0, row < items.count else { return }
    if userInitiated {
      triggerSelectionHaptic()
    }
    wheelDelegate?.drumPickerWheelView(
      self,
      didSelectRow: row,
      value: items[row],
      userInitiated: userInitiated
    )
  }

  private func ensureSelectionGenerator() {
    if selectionGenerator == nil {
      selectionGenerator = UISelectionFeedbackGenerator()
    }
    selectionGenerator?.prepare()
  }

  private func triggerSelectionHaptic() {
    guard hapticFeedback else { return }
    ensureSelectionGenerator()
    selectionGenerator?.selectionChanged()
  }

  // MARK: - UIPickerViewDataSource

  public func numberOfComponents(in pickerView: UIPickerView) -> Int { 1 }

  public func pickerView(_ pickerView: UIPickerView, numberOfRowsInComponent component: Int) -> Int {
    items.count
  }

  // MARK: - UIPickerViewDelegate

  public func pickerView(_ pickerView: UIPickerView, rowHeightForComponent component: Int) -> CGFloat {
    itemHeight
  }

  public func pickerView(
    _ pickerView: UIPickerView,
    viewForRow row: Int,
    forComponent component: Int,
    reusing view: UIView?
  ) -> UIView {
    let label = (view as? UILabel) ?? UILabel()
    label.textAlignment = .center
    label.backgroundColor = itemBackgroundColor
    label.text = row < items.count ? items[row] : ""
    let isSelected = row == pickerView.selectedRow(inComponent: 0)
    label.font = UIFont.systemFont(
      ofSize: isSelected ? selectedTextSize : textSize,
      weight: isSelected ? .semibold : .regular
    )
    label.textColor = isSelected ? selectedTextColor : textColor
    label.frame = CGRect(x: 0, y: 0, width: pickerView.bounds.width, height: itemHeight)
    return label
  }

  public func pickerView(_ pickerView: UIPickerView, didSelectRow row: Int, inComponent component: Int) {
    guard !suppressSelectionEvents, !isProgrammaticSelection else {
      lastSelectedIndex = row
      selectedIndex = row
      return
    }

    if row == lastSelectedIndex {
      return
    }

    selectedIndex = row
    // The wheel is the source of truth once the user has spun it.
    requestedSelectedIndex = row
    lastSelectedIndex = row
    pickerView.reloadComponent(0)
    notifySelection(row: row, userInitiated: true)
    maybeRecenterCircularIfNeeded(row: row)
  }

  private func maybeRecenterCircularIfNeeded(row: Int) {
    guard isCircular, !items.isEmpty else { return }
    let realCount = circularRealItemCount
    guard realCount > 1 else { return }
    let total = items.count
    guard total > realCount else { return }
    let threshold = total / 4
    if row >= threshold && row <= total - threshold {
      return
    }
    let realIndex = ((row % realCount) + realCount) % realCount
    let centerBase = (total / 2 / realCount) * realCount
    let center = centerBase + realIndex
    guard center != row else { return }

    isProgrammaticSelection = true
    picker.selectRow(center, inComponent: 0, animated: false)
    selectedIndex = center
    requestedSelectedIndex = center
    lastSelectedIndex = center
    DispatchQueue.main.async {
      self.isProgrammaticSelection = false
    }
  }

  private func centerToVirtualMiddle(animated: Bool) {
    guard isCircular, !items.isEmpty else { return }
    let realCount = circularRealItemCount
    guard realCount > 0 else { return }
    let current = picker.selectedRow(inComponent: 0)
    let safeCurrent = min(max(current, 0), max(items.count - 1, 0))
    let realIndex = ((safeCurrent % realCount) + realCount) % realCount
    let center = (items.count / 2 / realCount) * realCount + realIndex
    isProgrammaticSelection = true
    picker.selectRow(center, inComponent: 0, animated: animated)
    selectedIndex = center
    requestedSelectedIndex = center
    lastSelectedIndex = center
    DispatchQueue.main.async {
      self.isProgrammaticSelection = false
    }
  }

  private func resolveCircularRealItemCount(totalCount: Int) -> Int {
    guard isCircular, totalCount > 1 else { return totalCount }
    if totalCount % DrumPickerDefaults.circularMultiplierSmallList == 0 {
      let real = totalCount / DrumPickerDefaults.circularMultiplierSmallList
      if (2...100).contains(real) {
        return real
      }
    }
    if totalCount % DrumPickerDefaults.circularMultiplierLargeList == 0 {
      let real = totalCount / DrumPickerDefaults.circularMultiplierLargeList
      if real > 1 {
        return real
      }
    }
    return totalCount
  }
}
