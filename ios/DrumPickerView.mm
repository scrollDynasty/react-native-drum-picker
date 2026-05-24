#import "DrumPickerView.h"

#import <React/RCTConversions.h>
#import <react/renderer/components/DrumPickerViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/DrumPickerViewSpec/EventEmitters.h>
#import <react/renderer/components/DrumPickerViewSpec/Props.h>
#import <react/renderer/components/DrumPickerViewSpec/RCTComponentViewHelpers.h>

#import "DrumPicker-Swift.h"

using namespace facebook::react;

@interface DrumPickerView () <RCTDrumPickerViewViewProtocol, DrumPickerWheelViewDelegate>
@end

@implementation DrumPickerView {
  DrumPickerWheelView *_wheelView;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<DrumPickerViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const DrumPickerViewProps>();
    _props = defaultProps;

    _wheelView = [[DrumPickerWheelView alloc] initWithFrame:CGRectZero];
    _wheelView.wheelDelegate = self;
    self.contentView = _wheelView;
  }

  return self;
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _wheelView.wheelDelegate = nil;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  if (_wheelView.wheelDelegate != self) {
    _wheelView.wheelDelegate = self;
  }

  const auto &newViewProps = *std::static_pointer_cast<const DrumPickerViewProps const>(props);
  const auto &oldViewProps =
      oldProps != nullptr
          ? *std::static_pointer_cast<const DrumPickerViewProps const>(oldProps)
          : *std::static_pointer_cast<const DrumPickerViewProps const>(_props);

  if (oldViewProps.items != newViewProps.items) {
    NSMutableArray<NSString *> *items = [NSMutableArray arrayWithCapacity:newViewProps.items.size()];
    for (const auto &item : newViewProps.items) {
      [items addObject:[NSString stringWithUTF8String:item.c_str()]];
    }
    [_wheelView setItems:items];
  }

  if (oldViewProps.selectedIndex != newViewProps.selectedIndex) {
    [_wheelView setSelectedIndex:newViewProps.selectedIndex animated:NO];
  }

  if (oldViewProps.itemHeight != newViewProps.itemHeight) {
    [_wheelView setItemHeight:(CGFloat)newViewProps.itemHeight];
  }

  if (oldViewProps.visibleItemCount != newViewProps.visibleItemCount) {
    [_wheelView setVisibleItemCount:newViewProps.visibleItemCount];
  }

  if (oldViewProps.textColor != newViewProps.textColor) {
    [_wheelView setTextColor:RCTUIColorFromSharedColor(newViewProps.textColor)];
  }

  if (oldViewProps.selectedTextColor != newViewProps.selectedTextColor) {
    [_wheelView setSelectedTextColor:RCTUIColorFromSharedColor(newViewProps.selectedTextColor)];
  }

  if (oldViewProps.textSize != newViewProps.textSize) {
    [_wheelView setTextSize:(CGFloat)newViewProps.textSize];
  }

  if (oldViewProps.selectedTextSize != newViewProps.selectedTextSize) {
    [_wheelView setSelectedTextSize:(CGFloat)newViewProps.selectedTextSize];
  }

  if (oldViewProps.showSelectionIndicator != newViewProps.showSelectionIndicator) {
    [_wheelView setShowSelectionIndicator:newViewProps.showSelectionIndicator];
  }

  if (oldViewProps.selectionIndicatorColor != newViewProps.selectionIndicatorColor) {
    [_wheelView setSelectionIndicatorColor:RCTUIColorFromSharedColor(newViewProps.selectionIndicatorColor)];
  }

  if (oldViewProps.selectionIndicatorHeight != newViewProps.selectionIndicatorHeight) {
    [_wheelView setSelectionIndicatorHeight:(CGFloat)newViewProps.selectionIndicatorHeight];
  }

  if (oldViewProps.backgroundColor != newViewProps.backgroundColor) {
    [_wheelView setPickerBackgroundColor:RCTUIColorFromSharedColor(newViewProps.backgroundColor)];
  }

  if (oldViewProps.containerBackgroundColor != newViewProps.containerBackgroundColor) {
    [_wheelView setContainerBackgroundColor:RCTUIColorFromSharedColor(newViewProps.containerBackgroundColor)];
  }

  if (oldViewProps.itemBackgroundColor != newViewProps.itemBackgroundColor) {
    [_wheelView setItemBackgroundColor:RCTUIColorFromSharedColor(newViewProps.itemBackgroundColor)];
  }

  if (oldViewProps.hapticFeedback != newViewProps.hapticFeedback) {
    [_wheelView setHapticFeedback:newViewProps.hapticFeedback];
  }

  [super updateProps:props oldProps:oldProps];
}

#pragma mark - DrumPickerWheelViewDelegate

- (void)drumPickerWheelView:(DrumPickerWheelView *)view
              didSelectRow:(NSInteger)row
                     value:(NSString *)value
            userInitiated:(BOOL)userInitiated
{
  if (!userInitiated || _eventEmitter == nullptr) {
    return;
  }

  auto emitter = std::static_pointer_cast<const DrumPickerViewEventEmitter>(_eventEmitter);
  DrumPickerViewEventEmitter::OnValueChange payload = {
      .index = static_cast<int>(row),
      .value = std::string([value UTF8String]),
  };
  emitter->onValueChange(payload);
}

@end

Class<RCTComponentViewProtocol> DrumPickerViewCls(void)
{
  return DrumPickerView.class;
}
