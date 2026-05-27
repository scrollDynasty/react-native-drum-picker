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
