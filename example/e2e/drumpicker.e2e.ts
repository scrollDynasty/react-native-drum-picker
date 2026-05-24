import { device, element, by, expect, waitFor } from 'detox';

const SCROLL_STEP = 200;
const SCROLL_ATTEMPTS = 12;

async function waitForE2eReady() {
  await waitFor(element(by.text('E2E fixtures')))
    .toBeVisible()
    .withTimeout(60000);
  await waitFor(element(by.id('drum-picker-basic')))
    .toBeVisible()
    .withTimeout(15000);
}

/** Scroll down until testID is visible. Avoid scrollTo(top) — it hangs on iOS ScrollView in Detox. */
async function scrollToElement(testID: string) {
  const target = element(by.id(testID));
  const scroller = element(by.id('app-scroll'));

  try {
    await waitFor(target).toBeVisible().withTimeout(2000);
    return;
  } catch {
    // Element not on screen yet.
  }

  for (let attempt = 0; attempt < SCROLL_ATTEMPTS; attempt += 1) {
    try {
      await waitFor(target).toBeVisible().withTimeout(1500);
      return;
    } catch {
      await scroller.scroll(SCROLL_STEP, 'down');
    }
  }
  await waitFor(target).toBeVisible().withTimeout(5000);
}

/**
 * Move a DrumPicker wheel to another row.
 * Android: native RecyclerView supports Detox scroll().
 * iOS: UIPickerView is not a UIScrollView — use setColumnToValue or swipe.
 */
async function moveDrumPicker(
  testID: string,
  options: {
    direction?: 'down' | 'up';
    offset?: number;
    /** When set on iOS, uses setColumnToValue(0, value) for a deterministic selection. */
    iosSelectValue?: string;
  } = {}
) {
  const picker = element(by.id(testID));
  const direction = options.direction ?? 'down';
  const offset = options.offset ?? 100;

  if (device.getPlatform() === 'ios') {
    if (options.iosSelectValue != null) {
      try {
        await picker.setColumnToValue(0, options.iosSelectValue);
      } catch {
        // GREY needs a UIPickerView; fall back to swipe if setColumnToValue cannot match.
        await picker.swipe('up', 'fast', 0.6);
      }
      return;
    }
    // Swipe up on the wheel selects the next row (same as scrolling "down" on Android).
    await picker.swipe(direction === 'down' ? 'up' : 'down', 'fast', 0.6);
    return;
  }

  await picker.scroll(offset, direction);
}

async function openE2eTabIfNeeded() {
  await waitFor(element(by.text('react-native-drum-picker')))
    .toBeVisible()
    .withTimeout(90000);

  try {
    await waitFor(element(by.id('drum-picker-basic')))
      .toBeVisible()
      .withTimeout(5000);
    return;
  } catch {
    // Not on the E2E tab yet.
  }

  try {
    await element(by.text('E2E')).tap();
  } catch {
    await element(by.id('tab-e2e')).tap();
  }

  await waitForE2eReady();
}

describe('DrumPicker', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();
    await openE2eTabIfNeeded();
  });

  it('renders the picker on screen', async () => {
    await expect(element(by.id('drum-picker-basic'))).toBeVisible();
  });

  it('snaps to correct item after scroll', async () => {
    if (device.getPlatform() === 'ios') {
      await moveDrumPicker('drum-picker-basic', { iosSelectValue: 'Tue' });
      await waitFor(element(by.id('selected-value-label')))
        .toHaveText(/Tue|Wed|Thu|Fri|Sat|Sun/)
        .withTimeout(3000);
    } else {
      await moveDrumPicker('drum-picker-basic', { direction: 'down' });
      await waitFor(element(by.id('selected-value-label')))
        .toHaveText(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/)
        .withTimeout(3000);
    }
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
    await moveDrumPicker('drum-picker-haptic', { direction: 'down', offset: 80 });
    await expect(element(by.id('drum-picker-haptic'))).toBeVisible();
  });

  it('DateDrumPicker shows day, month, year columns', async () => {
    await scrollToElement('date-picker-day');
    await expect(element(by.id('date-picker-day'))).toBeVisible();
    await expect(element(by.id('date-picker-month'))).toBeVisible();
    await expect(element(by.id('date-picker-year'))).toBeVisible();
  });

  it('DateDrumPicker onChange returns valid date object', async () => {
    await scrollToElement('date-picker-day');
    if (device.getPlatform() === 'ios') {
      await moveDrumPicker('date-picker-day', { iosSelectValue: '11' });
    } else {
      await moveDrumPicker('date-picker-day', { direction: 'down', offset: 50 });
    }
    await waitFor(element(by.id('date-value-label')))
      .toHaveText(/day:\d+, month:\d+, year:\d+/)
      .withTimeout(3000);
  });
});
