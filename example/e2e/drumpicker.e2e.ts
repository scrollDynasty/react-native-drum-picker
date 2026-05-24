import { device, element, by, expect, waitFor } from 'detox';

async function scrollToElement(testID: string) {
  await waitFor(element(by.id(testID)))
    .toBeVisible()
    .whileElement(by.id('e2e-scroll'))
    .scroll(200, 'down');
}

async function openE2eTab() {
  await waitFor(element(by.text('E2E')))
    .toBeVisible()
    .withTimeout(15000);
  await element(by.text('E2E')).tap();
}

describe('DrumPicker', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await openE2eTab();
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
    await scrollToElement('date-picker-day');
    await expect(element(by.id('date-picker-day'))).toBeVisible();
    await scrollToElement('date-picker-month');
    await expect(element(by.id('date-picker-month'))).toBeVisible();
    await scrollToElement('date-picker-year');
    await expect(element(by.id('date-picker-year'))).toBeVisible();
  });

  it('DateDrumPicker onChange returns valid date object', async () => {
    await scrollToElement('date-picker-day');
    const dayPicker = element(by.id('date-picker-day'));
    await dayPicker.scroll(50, 'down');
    await waitFor(element(by.id('date-value-label')))
      .toHaveText(/day:\d+, month:\d+, year:\d+/)
      .withTimeout(3000);
  });

  it('controlled selectedIndex updates picker position', async () => {
    await scrollToElement('btn-set-index-3');
    await element(by.id('btn-set-index-3')).tap();
    await waitFor(element(by.id('controlled-selected-label')))
      .toHaveText('L')
      .withTimeout(3000);
  });

  it('hapticFeedback prop does not crash', async () => {
    await scrollToElement('drum-picker-haptic');
    await expect(element(by.id('drum-picker-haptic'))).toBeVisible();
    const picker = element(by.id('drum-picker-haptic'));
    await picker.scroll(80, 'down');
    await expect(picker).toBeVisible();
  });
});
