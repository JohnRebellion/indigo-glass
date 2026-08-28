import { test, expect } from '@playwright/test';

test('shell loads + 5 tabs visible', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });

  await page.goto('/');

  await expect(page.getByTestId('shell-header')).toBeVisible();
  for (const tab of ['overview', 'browser', 'vscode', 'claude-code', 'grub']) {
    await expect(page.getByTestId(`tab-${tab}`)).toBeVisible();
  }
  await expect(page.getByTestId('surfaces')).toBeVisible();
  await expect(page.getByTestId('palette')).toBeVisible();

  expect(errors.filter((e) => !e.includes('favicon'))).toEqual([]);
});

test('palette has 11 swatches', async ({ page }) => {
  await page.goto('/');
  const expected = [
    'base', 'surface', 'surface_alt',
    'sage', 'sage_hi', 'sage_alt',
    'amber', 'positive', 'negative',
    'text', 'text_muted'
  ];
  for (const tok of expected) {
    await expect(page.getByTestId(`swatch-${tok}`)).toBeVisible();
  }
});

test('browser tab renders mock site', async ({ page }) => {
  await page.goto('/browser/');
  await expect(page.getByTestId('sim-browser')).toBeVisible();
  await expect(page.getByTestId('addr-input')).toHaveValue(/github\.com/);
  await page.getByTestId('tab-feed').click();
  await expect(page.locator('text=Linear app dark discipline')).toBeVisible();
});

test('vscode tab shows file list + editor', async ({ page }) => {
  await page.goto('/vscode/');
  await expect(page.getByTestId('sim-vscode')).toBeVisible();
  await page.getByTestId('file-theme-json').click();
  await expect(page.locator('text=editor.background')).toBeVisible();
});

test('claude code tab renders user + assistant + tool', async ({ page }) => {
  await page.goto('/vscode/claude-code/');
  await expect(page.getByTestId('sim-claude-code')).toBeVisible();
  await expect(page.getByTestId('msg-user').first()).toBeVisible();
  await expect(page.getByTestId('msg-tool-in')).toBeVisible();
  await expect(page.getByTestId('msg-tool-out')).toBeVisible();
  await expect(page.getByTestId('msg-assistant').first()).toBeVisible();
});

test('claude code composer can send', async ({ page }) => {
  await page.goto('/vscode/claude-code/');
  const composer = page.getByTestId('composer');
  await composer.fill('Test prompt');
  await page.getByTestId('send').click();
  await expect(page.locator('text=Test prompt')).toBeVisible();
  await expect(page.locator('text=Acknowledged')).toBeVisible({ timeout: 2000 });
});

test('tab nav active state', async ({ page }) => {
  await page.goto('/vscode/');
  await expect(page.getByTestId('tab-vscode')).toHaveClass(/active/);
  await page.getByTestId('tab-browser').click();
  await page.waitForURL(/\/browser/);
  await expect(page.getByTestId('tab-browser')).toHaveClass(/active/);
});

test('reduced motion honored', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/browser/');
  await expect(page.getByTestId('sim-browser')).toBeVisible();
});
