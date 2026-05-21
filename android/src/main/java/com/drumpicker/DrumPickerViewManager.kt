package com.drumpicker

import android.util.Log
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ReactStylesDiffMap
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

  public override fun createViewInstance(context: ThemedReactContext): DrumPickerView {
    Log.d(TAG, "createViewInstance")
    return DrumPickerView(context)
  }

  override fun updateProperties(view: DrumPickerView, props: ReactStylesDiffMap) {
    for ((key, value) in props.toMap()) {
      when (key) {
        "items" -> view.setItemsProp(value)
        "selectedIndex" -> view.setSelectedIndexProp(value)
        "itemHeight" -> view.setItemHeightProp(value)
        "visibleItemCount" -> view.setVisibleItemCountProp(value)
        "textColor" -> view.setTextColorProp(value)
        "selectedTextColor" -> view.setSelectedTextColorProp(value)
        "textSize" -> view.setTextSizeProp(value)
        "selectedTextSize" -> view.setSelectedTextSizeProp(value)
        else -> delegate.setProperty(view, key, value)
      }
    }
    onAfterUpdateTransaction(view)
  }

  override fun setItems(view: DrumPickerView?, value: ReadableArray?) {
    view?.setItemsProp(value)
  }

  override fun setSelectedIndex(view: DrumPickerView?, value: Int) {
    view?.setSelectedIndexProp(value)
  }

  override fun setItemHeight(view: DrumPickerView?, value: Float) {
    view?.setItemHeightProp(value)
  }

  override fun setVisibleItemCount(view: DrumPickerView?, value: Int) {
    view?.setVisibleItemCountProp(value)
  }

  override fun setTextColor(view: DrumPickerView?, value: Int?) {
    view?.setTextColorProp(value)
  }

  override fun setSelectedTextColor(view: DrumPickerView?, value: Int?) {
    view?.setSelectedTextColorProp(value)
  }

  override fun setTextSize(view: DrumPickerView?, value: Float) {
    view?.setTextSizeProp(value)
  }

  override fun setSelectedTextSize(view: DrumPickerView?, value: Float) {
    view?.setSelectedTextSizeProp(value)
  }

  companion object {
    const val NAME = "DrumPickerView"
    private const val TAG = "DrumPicker"
  }
}
