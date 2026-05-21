package com.drumpicker

import android.graphics.Color
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.DrumPickerViewManagerInterface
import com.facebook.react.viewmanagers.DrumPickerViewManagerDelegate

@ReactModule(name = DrumPickerViewManager.NAME)
class DrumPickerViewManager : SimpleViewManager<DrumPickerView>(),
  DrumPickerViewManagerInterface<DrumPickerView> {
  private val mDelegate: ViewManagerDelegate<DrumPickerView>

  init {
    mDelegate = DrumPickerViewManagerDelegate(this)
  }

  override fun getDelegate(): ViewManagerDelegate<DrumPickerView>? {
    return mDelegate
  }

  override fun getName(): String {
    return NAME
  }

  public override fun createViewInstance(context: ThemedReactContext): DrumPickerView {
    return DrumPickerView(context)
  }

  @ReactProp(name = "color")
  override fun setColor(view: DrumPickerView?, color: Int?) {
    view?.setBackgroundColor(color ?: Color.TRANSPARENT)
  }

  companion object {
    const val NAME = "DrumPickerView"
  }
}
