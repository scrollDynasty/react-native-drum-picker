package com.drumpicker

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class TestActivity : AppCompatActivity() {
  lateinit var picker: DrumPickerView

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    picker = DrumPickerView(this)
    picker.setItemsProp(
      listOf(
        "Alpha",
        "Beta",
        "Gamma",
        "Delta",
        "Echo",
        "Foxtrot",
        "Golf",
        "Hotel",
      ),
    )
    picker.setItemHeightProp(44f)
    picker.setVisibleItemCountProp(5)
    setContentView(picker)
  }
}
