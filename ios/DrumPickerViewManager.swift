import React

@objc(DrumPickerViewManager)
final class DrumPickerViewManager: RCTViewManager {
  override static func requiresMainQueueSetup() -> Bool { true }

  override func view() -> UIView! {
    DrumPickerWheelView()
  }
}
