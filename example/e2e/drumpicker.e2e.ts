import { device, element, by, expect, waitFor } from 'detox';

describe('DrumPicker', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await element(by.text('E2E')).tap();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('E2E')).tap();
  });

  it('renders the picker on screen', async () => {
    await expect(element(by.id('drum-picker-basic'))).toBeVisible();
  });

  it('snaps to correct item after scroll', async () => {
    const picker = element(by.id('drum-picker-basic'));
    await picker.scroll(100, 'down');
    await waitFor(element(by.id('selected-value-label')))
      .toHaveText(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/)
      .withTimeout(3000);
  });

  it('DateDrumPicker shows day, month, year columns', async () => {
    await expect(element(by.id('date-picker-day'))).toBeVisible();
    await expect(element(by.id('date-picker-month'))).toBeVisible();
    await expect(element(by.id('date-picker-year'))).toBeVisible();
  });

  it('DateDrumPicker onChange returns valid date object', async () => {
    const dayPicker = element(by.id('date-picker-day'));
    await dayPicker.scroll(50, 'down');
    await waitFor(element(by.id('date-value-label')))
      .toHaveText(/day:\d+, month:\d+, year:\d+/)
      .withTimeout(3000);
  });

  it('controlled selectedIndex updates picker position', async () => {
    await element(by.id('btn-set-index-3')).tap();
    await waitFor(element(by.id('controlled-selected-label')))
      .toHaveText('3')
      .withTimeout(2000);
  });

  it('hapticFeedback prop does not crash', async () => {
    await expect(element(by.id('drum-picker-haptic'))).toBeVisible();
    const picker = element(by.id('drum-picker-haptic'));
    await picker.scroll(80, 'down');
    await expect(picker).toBeVisible();
  });
});
