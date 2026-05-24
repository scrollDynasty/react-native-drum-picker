import { device, element, by, expect, waitFor } from 'detox';

async function waitForE2eScreen() {
  await waitFor(element(by.id('e2e-screen')))
    .toBeVisible()
    .withTimeout(60000);
  await waitFor(element(by.id('drum-picker-basic')))
    .toBeVisible()
    .withTimeout(10000);
}

async function scrollAppTo(position: 'top' | 'bottom') {
  await element(by.id('app-scroll')).scrollTo(position);
}

async function scrollToElement(testID: string) {
  const target = element(by.id(testID));
  try {
    await waitFor(target).toBeVisible().withTimeout(2000);
    return;
  } catch {
    // Fall through — element may be below the fold on smaller screens.
  }
  await scrollAppTo('bottom');
  await waitFor(target).toBeVisible().withTimeout(10000);
}

describe('DrumPicker', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    try {
      await waitForE2eScreen();
    } catch {
      await waitFor(element(by.id('tab-e2e')))
        .toBeVisible()
        .withTimeout(10000);
      await element(by.id('tab-e2e')).tap();
      await waitForE2eScreen();
    }
  });

  beforeEach(async () => {
    await scrollAppTo('top');
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
    await waitFor(element(by.id('btn-set-index-3')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('btn-set-index-3')).tap();
    await waitFor(element(by.id('controlled-selected-label')))
      .toHaveText('L')
      .withTimeout(3000);
  });

  it('hapticFeedback prop does not crash', async () => {
    await waitFor(element(by.id('drum-picker-haptic')))
      .toBeVisible()
      .withTimeout(5000);
    const picker = element(by.id('drum-picker-haptic'));
    await picker.scroll(80, 'down');
    await expect(picker).toBeVisible();
  });
});
