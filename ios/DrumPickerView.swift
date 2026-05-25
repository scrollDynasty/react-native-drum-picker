import UIKit

@objc public protocol DrumPickerWheelViewDelegate: NSObjectProtocol {
  func drumPickerWheelView(
    _ view: DrumPickerWheelView,
    didSelectRow row: Int,
    value: String,
    userInitiated: Bool
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
}

@objc(DrumPickerWheelView)
public final class DrumPickerWheelView: UIView, UIPickerViewDataSource, UIPickerViewDelegate {
  @objc public weak var wheelDelegate: DrumPickerWheelViewDelegate?

  private let picker = UIPickerView()
  private let topIndicator = UIView()
  private let bottomIndicator = UIView()
  private var selectionGenerator: UISelectionFeedbackGenerator?
  private weak var pickerScrollView: UIScrollView?

  private var items: [String] = []
  private var selectedIndex: Int = 0
  private var suppressSelectionEvents = false
  private var isProgrammaticSelection = false
  private var lastSelectedIndex = -1

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

  public override init(frame: CGRect) {
    super.init(frame: frame)
    commonInit()
  }

  public required init?(coder: NSCoder) {
    super.init(coder: coder)
    commonInit()
  }

  /// Performs initial setup of the view's subcomponents and layout.
  /// 
  /// Configures the container and picker appearance and delegation, disables interaction on the selection indicator views, adds the picker and indicator subviews to the hierarchy, updates the picker frame and indicator positions, and attaches the tap gesture recognizer used for tap-to-select behavior.
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

  /// Installs a tap gesture recognizer on the internal picker to forward tap events to the picker tap handler.
  /// 
  /// The recognizer does not cancel existing touch events on the picker, allowing normal picker interactions to continue.
  private func setupTapGesture() {
    let tap = UITapGestureRecognizer(target: self, action: #selector(handlePickerTap(_:)))
    tap.cancelsTouchesInView = false
    picker.addGestureRecognizer(tap)
  }

  /// Handles tap gestures on the internal picker and selects the item at the tapped location when tap-to-select is enabled.
  /// - Parameter gesture: The tap gesture recognizer whose location in the picker is used to determine the target row. When a valid row is found, it is applied as an animated, user-initiated selection.
  @objc private func handlePickerTap(_ gesture: UITapGestureRecognizer) {
    guard enableScrollByTapOnItem, !items.isEmpty else { return }
    let location = gesture.location(in: picker)
    let row = rowAtTapLocation(location)
    guard row >= 0, row < items.count else { return }
    applySelectedIndex(row, animated: true, userInitiated: true)
  }

  /// Maps a tap location within the picker to the corresponding item row index.
  /// - Parameters:
  ///   - point: The tap location in the picker's coordinate space.
  /// - Returns: The resolved row index clamped to the valid range (0..items.count-1). If `items` is empty or `itemHeight` is not positive, returns `0`. The method first attempts to resolve a row by hit-testing visible row labels; if that fails it derives the row by the vertical offset from the picker center.
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

  /// Finds the picker row index whose visible label contains the given point.
  /// - Parameter point: A point in the picker's coordinate space to hit-test against visible row labels.
  /// - Returns: The index of the matched row if a visible label contains `point`, `nil` otherwise.
  private func rowFromVisibleLabelHitTest(at point: CGPoint) -> Int? {
    findRowLabel(in: picker, at: point)
  }

  /// Finds the index of the item whose visible label contains the specified point in the picker's coordinate space.
  /// - Parameters:
  ///   - view: Root view whose subviews will be traversed to locate UILabels.
  ///   - pointInPicker: Point in the picker's coordinate space used to hit-test visible labels.
  /// - Returns: The index of the matching item if found, `nil` otherwise.
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

  /// Simulates a user tap on the picker at the given point and selects the corresponding item.
  /// - Parameter point: Location (in the view's coordinate space) where the tap is simulated.
  /// - Note: If tap-to-select is disabled, there are no items, or the tap does not map to a valid row, the call has no effect. When a selection occurs it is treated as user-initiated and performed without animation.
  internal func testingTap(at point: CGPoint) {
    guard enableScrollByTapOnItem, !items.isEmpty else { return }
    let row = rowAtTapLocation(point)
    guard row >= 0, row < items.count else { return }
    applySelectedIndex(row, animated: false, userInitiated: true)
  }

  /// Fetches the current selected row index for unit tests.
  /// - Returns: The currently selected row index (0 when no items are present).
  internal func selectedIndexForTesting() -> Int {
    selectedIndex
  }

  /// Called when the view is moved to a window; ensures the picker’s scroll haptic observer is attached.
  public override func didMoveToWindow() {
    super.didMoveToWindow()
    attachScrollHapticObserver()
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
    attachScrollHapticObserver()
    if picker.accessibilityIdentifier != accessibilityIdentifier {
      picker.accessibilityIdentifier = accessibilityIdentifier
    }
  }

  private func attachScrollHapticObserver() {
    guard pickerScrollView == nil else { return }
    for subview in picker.subviews {
      guard let scrollView = subview as? UIScrollView else { continue }
      pickerScrollView = scrollView
      scrollView.panGestureRecognizer.addTarget(
        self,
        action: #selector(handlePickerPanBegan(_:))
      )
      break
    }
  }

  @objc private func handlePickerPanBegan(_ recognizer: UIGestureRecognizer) {
    guard recognizer.state == .began, hapticFeedback else { return }
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
    performProgrammaticUpdate {
      self.picker.reloadAllComponents()
      guard !self.items.isEmpty else {
        self.selectedIndex = 0
        self.lastSelectedIndex = -1
        return
      }
      let clamped = min(max(self.selectedIndex, 0), self.items.count - 1)
      self.selectedIndex = clamped
      self.picker.selectRow(clamped, inComponent: 0, animated: false)
      self.lastSelectedIndex = clamped
    }
  }

  @objc public func setSelectedIndex(_ index: Int, animated: Bool) {
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

  /// Enable or disable haptic feedback for selection changes.
  /// When enabled, the selection feedback generator is created and prepared immediately.
  /// - Parameter value: `true` to enable haptic feedback, `false` to disable it.
  @objc public func setHapticFeedback(_ value: Bool) {
    hapticFeedback = value
    if value {
      ensureSelectionGenerator()
    }
  }

  /// Enables or disables selecting a row by tapping on the picker's item area.
  /// - Parameter value: `true` to allow tap-to-select on picker items; `false` to disable it.
  @objc public func setEnableScrollByTapOnItem(_ value: Bool) {
    enableScrollByTapOnItem = value
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

  /// Apply a requested selection index to the picker, updating internal selection state and performing either a user-initiated or programmatic selection.
  /// - Parameters:
  ///   - index: The desired row index; will be clamped to the valid range [0, items.count - 1].
  ///   - animated: Whether the picker selection should animate.
  ///   - userInitiated: If `true`, treat the change as user-initiated (update the picker, notify the delegate, and update `lastSelectedIndex`). If `false`, perform a programmatic update without emitting selection notifications.
  /// - Note: If `items` is empty the selection is reset (`selectedIndex = 0`, `lastSelectedIndex = -1`).
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
    lastSelectedIndex = row
    pickerView.reloadComponent(0)
    notifySelection(row: row, userInitiated: true)
  }
}
