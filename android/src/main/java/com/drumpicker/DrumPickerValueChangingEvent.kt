package com.drumpicker

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

internal class DrumPickerValueChangingEvent(
  surfaceId: Int,
  viewId: Int,
  private val index: Int,
  private val value: String,
) : Event<DrumPickerValueChangingEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap =
    Arguments.createMap().apply {
      putInt("index", index)
      putString("value", value)
    }

  private companion object {
    const val EVENT_NAME = "topValueChanging"
  }
}
