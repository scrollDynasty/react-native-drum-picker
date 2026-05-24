import React

// NOTE: This library requires New Architecture (Fabric) on iOS.
// This view manager exists only for autolinking registration.
// Props are managed exclusively through the Fabric codegen path
// (DrumPickerView.mm / DrumPickerViewCls).
// Paper / Old Architecture is NOT supported on iOS.

@objc(DrumPickerViewManager)
final class DrumPickerViewManager: RCTViewManager {
  override static func requiresMainQueueSetup() -> Bool { true }

  override func view() -> UIView! {
    DrumPickerWheelView()
  }
}
