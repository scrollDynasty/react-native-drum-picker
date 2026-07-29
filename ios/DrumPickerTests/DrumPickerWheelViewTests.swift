import XCTest
@testable import DrumPicker

final class DrumPickerWheelViewTests: XCTestCase {
  private var view: DrumPickerWheelView!
  private var picker: UIPickerView {
    view.subviews.compactMap { $0 as? UIPickerView }.first!
  }

  override func setUp() {
    super.setUp()
    view = DrumPickerWheelView(frame: CGRect(x: 0, y: 0, width: 200, height: 220))
    view.setItems(["Alpha", "Beta", "Gamma", "Delta", "Echo"])
    view.setItemHeight(44)
    view.setVisibleItemCount(5)
    view.layoutIfNeeded()
  }

  func testNumberOfRows() {
    XCTAssertEqual(view.pickerView(picker, numberOfRowsInComponent: 0), 5)
  }

  func testEmptyItems() {
    view.setItems([])
    view.layoutIfNeeded()
    RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.01))
    XCTAssertEqual(view.pickerView(picker, numberOfRowsInComponent: 0), 0)
  }

  func testSelectedIndexClamped() {
    XCTAssertNoThrow(view.setSelectedIndex(999, animated: false))
    XCTAssertEqual(picker.selectedRow(inComponent: 0), 4)
  }

  func testSetSelectedIndexAnimatedUpdatesRow() {
    view.setSelectedIndex(4, animated: true)
    let exp = expectation(description: "animated selection")
    DispatchQueue.main.async { exp.fulfill() }
    wait(for: [exp], timeout: 2.0)
    XCTAssertEqual(picker.selectedRow(inComponent: 0), 4)
    XCTAssertEqual(view.selectedIndexForTesting(), 4)
  }

  func testSetSelectedIndexAnimatedDoesNotNotifyDelegate() {
    let delegate = MockWheelDelegate()
    view.wheelDelegate = delegate
    view.setSelectedIndex(3, animated: true)
    let exp = expectation(description: "animated selection flush")
    DispatchQueue.main.async { exp.fulfill() }
    wait(for: [exp], timeout: 2.0)
    XCTAssertEqual(delegate.userInitiatedCount, 0)
    XCTAssertEqual(view.selectedIndexForTesting(), 3)
  }

  func testViewForRowValid() {
    let cell = view.pickerView(
      picker,
      viewForRow: 2,
      forComponent: 0,
      reusing: nil
    )
    XCTAssertNotNil(cell)
  }

  func testProgrammaticSelectionSuppressed() {
    let delegate = MockWheelDelegate()
    view.wheelDelegate = delegate
    view.setSelectedIndex(3, animated: false)
    let exp = expectation(description: "main queue flush")
    DispatchQueue.main.async { exp.fulfill() }
    wait(for: [exp], timeout: 2.0)
    XCTAssertEqual(delegate.userInitiatedCount, 0)
  }

  func testHapticFeedbackPropertyAccepted() {
    XCTAssertNoThrow(view.setHapticFeedback(true))
    XCTAssertNoThrow(view.setHapticFeedback(false))
  }

  func testEnableScrollByTapOnItemPropertyAccepted() {
    XCTAssertNoThrow(view.setEnableScrollByTapOnItem(true))
    XCTAssertNoThrow(view.setEnableScrollByTapOnItem(false))
  }

  func testTapSelectsTappedRowWhenEnabled() {
    view.setSelectedIndex(2, animated: false)
    view.setEnableScrollByTapOnItem(true)
    view.layoutIfNeeded()
    RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.05))

    let rowZeroLabel = view.pickerView(
      picker,
      viewForRow: 0,
      forComponent: 0,
      reusing: nil
    )
    let frameInPicker = rowZeroLabel.convert(rowZeroLabel.bounds, to: picker)
    let tapPoint = CGPoint(x: frameInPicker.midX, y: frameInPicker.midY)

    view.testingTap(at: tapPoint)

    XCTAssertEqual(view.selectedIndexForTesting(), 0)
    XCTAssertEqual(picker.selectedRow(inComponent: 0), 0)
  }

  func testTapDoesNotReemitWhenAlreadySelected() {
    let delegate = MockWheelDelegate()
    view.wheelDelegate = delegate
    view.setSelectedIndex(2, animated: false)
    view.setEnableScrollByTapOnItem(true)
    view.layoutIfNeeded()
    RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.05))

    let rowLabel = view.pickerView(
      picker,
      viewForRow: 2,
      forComponent: 0,
      reusing: nil
    )
    let frameInPicker = rowLabel.convert(rowLabel.bounds, to: picker)
    let tapPoint = CGPoint(x: frameInPicker.midX, y: frameInPicker.midY)

    view.testingTap(at: tapPoint)

    XCTAssertEqual(delegate.userInitiatedCount, 0)
    XCTAssertEqual(view.selectedIndexForTesting(), 2)
  }

  // MARK: - Regression: mounting without a size (defect 1 / 5)

  func testSelectionSurvivesMountInZeroHeightContainer() {
    let collapsed = DrumPickerWheelView(frame: .zero)
    collapsed.setItemHeight(44)
    collapsed.setVisibleItemCount(5)
    collapsed.setItems(["Alpha", "Beta", "Gamma", "Delta", "Echo", "Foxtrot", "Golf", "Hotel"])
    collapsed.setSelectedIndex(7, animated: false)

    // Container expands, exactly like an accordion opening.
    collapsed.frame = CGRect(x: 0, y: 0, width: 200, height: 220)
    collapsed.layoutIfNeeded()
    RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.05))

    let wheel = collapsed.subviews.compactMap { $0 as? UIPickerView }.first!
    XCTAssertEqual(wheel.selectedRow(inComponent: 0), 7)
    XCTAssertEqual(collapsed.selectedIndexForTesting(), 7)
  }

  // MARK: - Regression: items swap (defect 3)

  func testGrowingItemsKeepsSelectedValueAndStaysSilent() {
    let delegate = MockWheelDelegate()
    let years = (1966...2031).map(String.init)
    let wider = (1926...2076).map(String.init)

    view.setItems(years)
    view.setSelectedIndex(years.firstIndex(of: "2026")!, animated: false)
    view.layoutIfNeeded()
    RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.05))
    view.wheelDelegate = delegate

    view.setItems(wider)
    view.setSelectedIndex(wider.firstIndex(of: "2026")!, animated: false)
    RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.05))

    XCTAssertEqual(picker.selectedRow(inComponent: 0), wider.firstIndex(of: "2026"))
    XCTAssertEqual(delegate.userInitiatedCount, 0)
  }

  func testShrinkingItemsKeepsSelectedValueWhenIndexArrivesFirst() {
    let wide = (1926...2076).map(String.init)
    let narrow = (1966...2031).map(String.init)

    view.setItems(wide)
    view.setSelectedIndex(wide.firstIndex(of: "2026")!, animated: false)
    view.layoutIfNeeded()
    RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.05))

    // Index applied while the wide list is still installed — clamping it against the stale list
    // is what used to move the selected year.
    view.setSelectedIndex(narrow.firstIndex(of: "2026")!, animated: false)
    view.setItems(narrow)
    RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.05))

    XCTAssertEqual(picker.selectedRow(inComponent: 0), narrow.firstIndex(of: "2026"))
    XCTAssertEqual(view.selectedIndexForTesting(), narrow.firstIndex(of: "2026"))
  }

  func testDependentColumnItemsChangeKeepsSelection() {
    let july = (1...31).map(String.init)
    let june = (1...30).map(String.init)

    view.setItems(july)
    view.setSelectedIndex(25, animated: false) // day 26
    view.layoutIfNeeded()
    RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.05))

    view.setItems(june)
    RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.05))

    XCTAssertEqual(picker.selectedRow(inComponent: 0), 25)
  }

  func testTapIgnoredWhenDisabled() {
    view.setSelectedIndex(2, animated: false)
    view.setEnableScrollByTapOnItem(false)
    view.layoutIfNeeded()

    let rowZeroLabel = view.pickerView(
      picker,
      viewForRow: 0,
      forComponent: 0,
      reusing: nil
    )
    let frameInPicker = rowZeroLabel.convert(rowZeroLabel.bounds, to: picker)
    view.testingTap(at: CGPoint(x: frameInPicker.midX, y: frameInPicker.midY))

    XCTAssertEqual(view.selectedIndexForTesting(), 2)
  }

  func testSetDisabledTogglesUserInteraction() {
    view.setDisabled(true)
    XCTAssertFalse(picker.isUserInteractionEnabled)

    view.setDisabled(false)
    XCTAssertTrue(picker.isUserInteractionEnabled)
  }

  func testProgrammaticSelectionStillWorksWhileDisabled() {
    view.setDisabled(true)
    view.setSelectedIndex(3, animated: false)

    XCTAssertEqual(view.selectedIndexForTesting(), 3)
    XCTAssertEqual(picker.selectedRow(inComponent: 0), 3)
  }
}

private final class MockWheelDelegate: NSObject, DrumPickerWheelViewDelegate {
  var userInitiatedCount = 0
  var lastRow: Int?

  func drumPickerWheelView(
    _ view: DrumPickerWheelView,
    didSelectRow row: Int,
    value: String,
    userInitiated: Bool
  ) {
    if userInitiated {
      userInitiatedCount += 1
      lastRow = row
    }
  }
}
