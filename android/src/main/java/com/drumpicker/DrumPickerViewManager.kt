package com.drumpicker

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

  public override fun createViewInstance(context: ThemedReactContext): DrumPickerView =
    DrumPickerView(context)

  override fun updateProperties(view: DrumPickerView, props: ReactStylesDiffMap) {
    for ((key, value) in props.toMap()) {
      when (key) {
        "items" -> view.setItemsProp(value)
        "scrollAnimated" -> view.setScrollAnimatedProp(value)
        "selectedIndex" -> view.setSelectedIndexProp(value)
        "itemHeight" -> view.setItemHeightProp(value)
        "visibleItemCount" -> view.setVisibleItemCountProp(value)
        "textColor" -> view.setTextColorProp(value)
        "selectedTextColor" -> view.setSelectedTextColorProp(value)
        "textSize" -> view.setTextSizeProp(value)
        "selectedTextSize" -> view.setSelectedTextSizeProp(value)
        "showSelectionIndicator" -> view.setShowSelectionIndicatorProp(value)
        "selectionIndicatorColor" -> view.setSelectionIndicatorColorProp(value)
        "selectionIndicatorHeight" -> view.setSelectionIndicatorHeightProp(value)
        "backgroundColor" -> view.setBackgroundColorProp(value)
        "containerBackgroundColor" -> view.setContainerBackgroundColorProp(value)
        "itemBackgroundColor" -> view.setItemBackgroundColorProp(value)
        "hapticFeedback" -> view.setHapticFeedbackProp(value)
        "circular" -> view.setCircularProp(value)
        "enableScrollByTapOnItem" -> view.setEnableScrollByTapOnItemProp(value)
        "onValueChangingEnabled" -> view.setOnValueChangingEnabledProp(value)
        else -> delegate.setProperty(view, key, value)
      }
    }
    onAfterUpdateTransaction(view)
  }

  override fun setItems(view: DrumPickerView?, value: ReadableArray?) {
    view?.setItemsProp(value)
  }

  override fun setScrollAnimated(view: DrumPickerView?, value: Boolean) {
    view?.setScrollAnimatedProp(value)
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

  override fun setShowSelectionIndicator(view: DrumPickerView?, value: Boolean) {
    view?.setShowSelectionIndicatorProp(value)
  }

  override fun setSelectionIndicatorColor(view: DrumPickerView?, value: Int?) {
    view?.setSelectionIndicatorColorProp(value)
  }

  override fun setSelectionIndicatorHeight(view: DrumPickerView?, value: Float) {
    view?.setSelectionIndicatorHeightProp(value)
  }

  override fun setBackgroundColor(view: DrumPickerView?, value: Int?) {
    view?.setBackgroundColorProp(value)
  }

  override fun setContainerBackgroundColor(view: DrumPickerView?, value: Int?) {
    view?.setContainerBackgroundColorProp(value)
  }

  override fun setItemBackgroundColor(view: DrumPickerView?, value: Int?) {
    view?.setItemBackgroundColorProp(value)
  }

  override fun setHapticFeedback(view: DrumPickerView?, value: Boolean) {
    view?.setHapticFeedbackProp(value)
  }

  override fun setCircular(view: DrumPickerView?, value: Boolean) {
    view?.setCircularProp(value)
  }

  override fun setEnableScrollByTapOnItem(view: DrumPickerView?, value: Boolean) {
    view?.setEnableScrollByTapOnItemProp(value)
  }

  override fun setOnValueChangingEnabled(view: DrumPickerView?, value: Boolean) {
    view?.setOnValueChangingEnabledProp(value)
  }

  companion object {
    const val NAME = "DrumPickerView"
  }
}
