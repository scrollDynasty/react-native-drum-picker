package com.drumpicker

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.DrumPickerViewManagerDelegate
import com.facebook.react.viewmanagers.DrumPickerViewManagerInterface

@ReactModule(name = DrumPickerViewManager.NAME)
class DrumPickerViewManager :
  SimpleViewManager<DrumPickerView>(),
  DrumPickerViewManagerInterface<DrumPickerView> {
  private val delegate: ViewManagerDelegate<DrumPickerView> =
    DrumPickerViewManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<DrumPickerView>? = delegate

  override fun getName(): String = NAME

  public override fun createViewInstance(context: ThemedReactContext): DrumPickerView =
    DrumPickerView(context)

  override fun setItems(view: DrumPickerView?, value: ReadableArray?) {
    view?.setItems(value)
  }

  override fun setSelectedIndex(view: DrumPickerView?, value: Int) {
    view?.setSelectedIndex(value)
  }

  override fun setItemHeight(view: DrumPickerView?, value: Float) {
    view?.setItemHeight(value)
  }

  override fun setVisibleItemCount(view: DrumPickerView?, value: Int) {
    view?.setVisibleItemCount(value)
  }

  override fun setTextColor(view: DrumPickerView?, value: Int?) {
    view?.setTextColor(value)
  }

  override fun setSelectedTextColor(view: DrumPickerView?, value: Int?) {
    view?.setSelectedTextColor(value)
  }

  override fun setTextSize(view: DrumPickerView?, value: Float) {
    view?.setTextSize(value)
  }

  override fun setSelectedTextSize(view: DrumPickerView?, value: Float) {
    view?.setSelectedTextSize(value)
  }

  companion object {
    const val NAME = "DrumPickerView"
  }
}
