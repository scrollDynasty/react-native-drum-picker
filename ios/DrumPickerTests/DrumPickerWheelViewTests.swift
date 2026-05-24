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
    XCTAssertEqual(view.pickerView(picker, numberOfRowsInComponent: 0), 0)
  }

  func testSelectedIndexClamped() {
    XCTAssertNoThrow(view.setSelectedIndex(999, animated: false))
    XCTAssertEqual(picker.selectedRow(inComponent: 0), 4)
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
    RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.1))
    XCTAssertEqual(delegate.userInitiatedCount, 0)
  }

  func testHapticFeedbackPropertyAccepted() {
    XCTAssertNoThrow(view.setHapticFeedback(true))
    XCTAssertNoThrow(view.setHapticFeedback(false))
  }
}

private final class MockWheelDelegate: NSObject, DrumPickerWheelViewDelegate {
  var userInitiatedCount = 0

  func drumPickerWheelView(
    _ view: DrumPickerWheelView,
    didSelectRow row: Int,
    value: String,
    userInitiated: Bool
  ) {
    if userInitiated {
      userInitiatedCount += 1
    }
  }
}
