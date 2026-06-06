import { test, expect, type Page } from '@playwright/test';

async function readPadding(page: Page, testId: string): Promise<string> {
  return await page
    .getByTestId(testId)
    .first()
    .evaluate((el) => getComputedStyle(el as Element).padding);
}

test.describe('density opt-in architecture', () => {
  test('default render (density OFF) preserves site-native padding', async ({ page }) => {
    await page.goto('/density-test/');
    await expect(page.getByTestId('density-test')).toBeVisible();

    const bareButtonPad = await readPadding(page, 'bare-button');
    const inputPad = await readPadding(page, 'input-email');

    // Native values from page CSS: form button = 6/14, form input = 6/10
    expect(bareButtonPad).toMatch(/6px\s+14px/);
    expect(inputPad).toMatch(/6px\s+10px/);
  });

  test('?density=on opt-in applies compact padding', async ({ page }) => {
    await page.goto('/density-test/?density=on');
    await expect(page.getByTestId('density-test')).toBeVisible();

    const bareButtonPad = await readPadding(page, 'bare-button');
    const inputPad = await readPadding(page, 'input-email');

    // Opt-in rules: button 4/10, input 4/8
    expect(bareButtonPad).toMatch(/4px\s+10px/);
    expect(inputPad).toMatch(/4px\s+8px/);
  });

  test('toggle button switches density state', async ({ page }) => {
    await page.goto('/density-test/');

    // Initially OFF
    let bareButtonPad = await readPadding(page, 'bare-button');
    expect(bareButtonPad).toMatch(/6px\s+14px/);

    // Click toggle
    await page.getByTestId('toggle-density').click();

    bareButtonPad = await readPadding(page, 'bare-button');
    expect(bareButtonPad).toMatch(/4px\s+10px/);

    // Toggle off
    await page.getByTestId('toggle-density').click();
    bareButtonPad = await readPadding(page, 'bare-button');
    expect(bareButtonPad).toMatch(/6px\s+14px/);
  });

  test('density OFF: sidebar list preserves native spacing', async ({ page }) => {
    await page.goto('/density-test/');
    const linkPad = await page
      .locator('.sidebar-list a')
      .first()
      .evaluate((el) => getComputedStyle(el).padding);
    // Native: 8/12
    expect(linkPad).toMatch(/8px\s+12px/);
  });

  test('density OFF: sidebar list with class preserves padding (not caught by :not([class]))', async ({ page }) => {
    // Important: our .ig-density-on opt-in rules use :not([class]) to AVOID
    // touching classed list items. Sidebar list has class, so it should not change.
    await page.goto('/density-test/?density=on');
    const linkPad = await page
      .locator('.sidebar-list a')
      .first()
      .evaluate((el) => getComputedStyle(el).padding);
    // Should remain native: 8/12 (sidebar-list a has class -> :not([class]) miss)
    expect(linkPad).toMatch(/8px\s+12px/);
  });

  test('code blocks always preserve mono regardless of density', async ({ page }) => {
    await page.goto('/density-test/?density=on');
    const ff = await page
      .locator('section[data-testid="section-code"] code')
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(ff.toLowerCase()).toMatch(/iosevka|mesloLGS|monospace/i);
  });

  test('snapshot: density OFF', async ({ page }) => {
    await page.goto('/density-test/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('density-off.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixelRatio: 0.02
    });
  });

  test('snapshot: density ON', async ({ page }) => {
    await page.goto('/density-test/?density=on');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('density-on.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixelRatio: 0.02
    });
  });
});
