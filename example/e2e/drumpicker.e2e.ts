import { device, element, by, expect, waitFor } from 'detox';

const SCROLL_STEP = 150;
const SCROLL_ATTEMPTS = 10;

async function scrollToElement(
  testID: string,
  direction: 'down' | 'up' = 'down'
) {
  const target = element(by.id(testID));
  for (let attempt = 0; attempt < SCROLL_ATTEMPTS; attempt += 1) {
    try {
      await waitFor(target).toBeVisible().withTimeout(1500);
      return;
    } catch {
      await element(by.id('e2e-scroll')).scroll(SCROLL_STEP, direction);
    }
  }
  await waitFor(target).toBeVisible().withTimeout(5000);
}

describe('DrumPicker', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    try {
      await waitFor(element(by.id('drum-picker-basic')))
        .toBeVisible()
        .withTimeout(60000);
    } catch {
      await waitFor(element(by.id('tab-e2e')))
        .toBeVisible()
        .withTimeout(10000);
      await element(by.id('tab-e2e')).tap();
      await waitFor(element(by.id('drum-picker-basic')))
        .toBeVisible()
        .withTimeout(30000);
    }
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
    await expect(element(by.id('date-picker-month'))).toBeVisible();
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
    const picker = element(by.id('drum-picker-haptic'));
    await picker.scroll(80, 'down');
    await expect(picker).toBeVisible();
  });
});
