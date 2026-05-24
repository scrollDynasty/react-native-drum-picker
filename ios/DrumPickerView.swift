import UIKit

@objc public protocol DrumPickerWheelViewDelegate: NSObjectProtocol {
  func drumPickerWheelView(
    _ view: DrumPickerWheelView,
    didSelectRow row: Int,
    value: String,
    userInitiated: Bool
  )
}

@objc(DrumPickerWheelView)
public final class DrumPickerWheelView: UIView, UIPickerViewDataSource, UIPickerViewDelegate {
  @objc public weak var wheelDelegate: DrumPickerWheelViewDelegate?

  private let picker = UIPickerView()
  private let topIndicator = UIView()
  private let bottomIndicator = UIView()
  private var selectionGenerator: UISelectionFeedbackGenerator?

  private var items: [String] = []
  private var selectedIndex: Int = 0
  private var suppressSelectionEvents = false
  private var lastSelectedIndex = -1

  private var itemHeight: CGFloat = 44
  private var visibleItemCount: Int = 5
  private var textColor: UIColor = UIColor(red: 0.56, green: 0.56, blue: 0.58, alpha: 1)
  private var selectedTextColor: UIColor = UIColor(red: 0.11, green: 0.11, blue: 0.12, alpha: 1)
  private var textSize: CGFloat = 20
  private var selectedTextSize: CGFloat = 22
  private var showSelectionIndicator = true
  private var selectionIndicatorColor: UIColor = UIColor(red: 0.82, green: 0.82, blue: 0.84, alpha: 1)
  private var selectionIndicatorHeight: CGFloat = 1
  private var itemBackgroundColor: UIColor = .clear
  private var containerBackgroundColor: UIColor = .clear
  private var hapticFeedback = false

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
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    updatePickerFrame()
    updateIndicators()
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
    picker.reloadAllComponents()
    applySelectedIndex(selectedIndex, userInitiated: false)
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
    picker.reloadAllComponents()
  }

  @objc public func setSelectedTextColor(_ color: UIColor) {
    selectedTextColor = color
    picker.reloadAllComponents()
  }

  @objc public func setTextSize(_ value: CGFloat) {
    textSize = max(1, value)
    picker.reloadAllComponents()
  }

  @objc public func setSelectedTextSize(_ value: CGFloat) {
    selectedTextSize = max(1, value)
    picker.reloadAllComponents()
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
    picker.reloadAllComponents()
  }

  @objc public func setContainerBackgroundColor(_ color: UIColor) {
    containerBackgroundColor = color
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

  public override var intrinsicContentSize: CGSize {
    CGSize(width: UIView.noIntrinsicMetric, height: itemHeight * CGFloat(max(visibleItemCount, 1)))
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
    suppressSelectionEvents = true
    picker.selectRow(clamped, inComponent: 0, animated: animated)
    suppressSelectionEvents = false
    if userInitiated {
      notifySelection(row: clamped, userInitiated: true)
    } else {
      lastSelectedIndex = clamped
    }
    picker.reloadAllComponents()
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
    selectedIndex = row
    pickerView.reloadAllComponents()
    if suppressSelectionEvents {
      lastSelectedIndex = row
      return
    }
    if row == lastSelectedIndex {
      return
    }
    lastSelectedIndex = row
    notifySelection(row: row, userInitiated: true)
  }
}
