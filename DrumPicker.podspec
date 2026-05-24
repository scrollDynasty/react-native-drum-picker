require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "DrumPicker"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/scrollDynasty/react-native-drum-picker.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"
  s.exclude_files = "ios/DrumPickerTests/**"
  s.private_header_files = "ios/**/*.h"
  s.swift_version = "5.0"

  s.test_spec "Tests" do |ts|
    ts.source_files = "ios/DrumPickerTests/**/*.swift"
    ts.framework = "XCTest"
    ts.dependency "DrumPicker"
  end

  install_modules_dependencies(s)
end
